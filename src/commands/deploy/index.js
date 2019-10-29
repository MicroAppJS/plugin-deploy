'use strict';

module.exports = function(api, opts = {}) {

    const chalk = require('chalk');

    api.registerCommand('deploy', {
        description: 'sync commit status.',
        usage: 'micro-app deploy [options]',
        options: {
            '-': 'deploy last commit',
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
        dist: '', ${chalk.gray('// git dist')}
        cname: '', ${chalk.gray('// 如果是发布到自定义域名, default: false')}
    }
          `.trim(),
    }, async args => {
        const _ = require('lodash');
        const logger = api.logger;

        const parseConfig = require('./parseConfig');
        const deployConfig = parseConfig(api, args, opts);

        if (_.isEmpty(deployConfig)) {
            logger.error('无法加载到 Deploy 配置信息...');
            return;
        }

        if (deployConfig && deployConfig.disabled) {
            logger.info('已禁用命令行 Deploy...');
            return;
        }

        api.applyPluginHooks('beforeCommandDeploy', { args, config: deployConfig });

        const deployCommit = require('./deployCommit');
        const result = await deployCommit(api, args, deployConfig);

        api.applyPluginHooks('afterCommandDeploy', { args, config: deployConfig });
        return result;
    });

};
