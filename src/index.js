'use strict';

module.exports = function DeployCommand(api, opts = {}) {

    api.assertVersion('>=0.1.5');

    const path = require('path');
    const chalk = require('chalk');
    const tryRequire = require('try-require');

    // commands
    require('./commands/version')(api);

    // methods
    require('./methods')(api, opts);

    // start
    api.registerCommand('deploy', {
        description: 'sync commit status.',
        usage: 'micro-app deploy [options]',
        options: {
            '-': 'deploy last commit',
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
        git: '', ${chalk.gray('// git 地址')}
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
    }
          `.trim(),
    }, args => {
        const logger = api.logger;

        const configFile = args.c || 'micro-app.deploy.config.js';
        const deployConfig = tryRequire(path.resolve(api.root, configFile));

        if (!deployConfig || typeof deployConfig !== 'object') {
            logger.warn('没有找到 "micro-app.deploy.config.js" 文件, 将使用默认配置.');
        }

        const config = Object.assign({}, opts, deployConfig || {});

        if (config && (config.disabled || config.disable)) {
            logger.info('已禁用命令行 Deploy...');
            return;
        }

        const deployCommit = require('./deployCommit');
        return deployCommit(api, args, config);
    });


};

module.exports.configuration = {
    description: '强制发布更新当前提交信息到指定 git 中命令行',
};
