'use strict';

module.exports = function(api, opts = {}) {

    const chalk = require('chalk');

    api.registerCommand('deploy', {
        description: 'sync commit status.',
        usage: 'micro-app deploy [options]',
        options: {
            '-': 'deploy last commit',
            '--type': '部署方式类型. (default: github)',
            '--message': 'git commit message.',
            '--name': 'git commit user name.',
            '--email': 'git commit user email.',
            '--hooks': 'git commit hooks.',
            '--config <config>': '指定配置文件路径, 相对于根路径. 默认为根目录下的: "micro-app.deploy.config.js"',
        },
        details: `
Examples:
    ${chalk.gray('# deploy')}
    micro-app deploy
    ${chalk.gray('# git hooks')}
    micro-app deploy --hooks
    ${chalk.gray('# config file')}
    micro-app deploy --config micro-app.deploy.config.js

Config:
    {
        disabled: false, ${chalk.gray('// 是否禁用该功能')}
        repository: '', ${chalk.gray('// git 地址')}
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
        dest: '', ${chalk.gray('// git dest')}
        cname: '', ${chalk.gray('// 如果是发布到自定义域名, default: false')}
    }
          `.trim(),
    }, args => {
        const _ = require('lodash');
        const logger = api.logger;

        const parseConfig = require('./parseConfig');
        const deployConfig = parseConfig(api, args, opts);

        if (_.isEmpty(deployConfig)) {
            logger.error('[Deploy]', '无法加载到 Deploy 配置信息...');
            return;
        }

        if (deployConfig && deployConfig.disabled) {
            logger.info('[Deploy]', '已禁用命令行 Deploy...');
            return;
        }

        // default: github
        args.type = args.type || 'git';

        let chain = Promise.resolve();

        chain = chain.then(() => api.applyPluginHooks('beforeCommandDeploy', { args, config: deployConfig }));

        const type = args.type;
        switch (type) {
            case 'git':
            case 'github':
            {
                const gitCMD = require('../git');
                chain = chain.then(() => gitCMD(api, args, deployConfig));
                break;
            }
            default:
                chain = chain.then(() => {
                    logger.warn('[Deploy]', `Not Found type: ${type}!`);
                    // TODO others type
                });
                break;
        }

        chain = chain.then(() => api.applyPluginHooks('afterCommandDeploy', { args, config: deployConfig }));

        return chain;
    });

};
