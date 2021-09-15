'use strict';

module.exports = function(api, opts = {}) {

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _, chalk } = require('@micro-app/shared-utils');

    api.registerCommand('deploy', {
        description: 'sync commit status.',
        usage: 'micro-app deploy [options]',
        options: {
            '-': 'deploy last commit',
            '--type': '部署方式类型. (default: github)',
            '--message': 'git commit message.',
            '--name': 'git commit user name.',
            '--email': 'git commit user email.',
            '--config <config>': '指定配置文件路径, 相对于根路径. 默认为: "config/deploy.js"',
        },
        details: `
Examples:
    ${chalk.gray('# deploy')}
    micro-app deploy
    ${chalk.gray('# config file')}
    micro-app deploy --config micro-app.deploy.config.js

Config:
    {
        disabled: false, ${chalk.gray('// 是否禁用该功能')}
        repository: '', ${chalk.gray('// github 地址')}
        ${chalk.gray('branch: \'\',')}
        branch: {  ${chalk.gray('// git branch')}
            name: '',
            extends: true,
        },
        message: '', ${chalk.gray('// git commit message')}
        user: { ${chalk.gray('// git user info')}
            name: '',
            email: '',
        },
        dest: '', ${chalk.gray('// git dest path')}
        cname: '', ${chalk.gray('// 如果是发布到自定义域名, default: false')}
    }
        `.trim(),
    }, args => {
        const logger = api.logger;

        const parseConfig = require('./parseConfig');
        let deployConfigs = parseConfig(api, args, opts);

        if (_.isEmpty(deployConfigs) || deployConfigs.length <= 0) {
            logger.error('[Deploy]', '无法加载到 Deploy 配置信息...');
            return;
        }

        deployConfigs = deployConfigs.filter((deployConfig, index) => {
            if (!deployConfig || deployConfig.disabled) {
                logger.info('[Deploy]', `"索引:${index}"`, '已禁用...');
                return false;
            }
            return true;
        });

        const deployCmds = [ // 部署支持的类型
            {
                type: 'github',
                run: require('./github'),
            },
        ].concat(api.applyPluginHooks('addCommandDeployType', []) || []);

        let chain = Promise.resolve();

        chain = chain.then(() => api.applyPluginHooks('beforeCommandDeploy', { args, config: deployConfigs }));

        deployConfigs.forEach(deployConfig => {
            // default: github
            const type = args.type || deployConfig.type || 'github';
            const allCmds = deployCmds.filter(item => item.type === type);
            if (allCmds.length > 0) {
                allCmds.forEach(item => {
                    const run = item.run;
                    chain = chain.then(() => run(api, args, deployConfig));
                });
            } else {
                chain = chain.then(() => logger.warn('[Deploy]', `Not Found type: ${type}!`));
            }
        });

        chain = chain.then(() => api.applyPluginHooks('afterCommandDeploy', { args, config: deployConfigs }));

        return chain.catch(e => {
            logger.throw('[Deploy]', e);
        });
    });

};
