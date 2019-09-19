'use strict';

module.exports = function DeployCommand(api, opts = {}) {

    const path = require('path');
    const chalk = require('chalk');
    const tryRequire = require('try-require');

    // commands
    require('./commands/version')(api);

    api.registerMethod('beforeCommandDeploy', {
        type: api.API_TYPE.EVENT,
        description: '发布前事件',
    });
    api.registerMethod('afterCommandDeploy', {
        type: api.API_TYPE.EVENT,
        description: '发布后事件',
    });
    api.registerMethod('modifyCommandDeployMessage', {
        type: api.API_TYPE.MODIFY,
        description: '发布消息二次编辑事件',
    });

    // start
    api.registerCommand('deploy', {
        description: 'sync commit status.',
        usage: 'micro-app deploy [options]',
        options: {
            '-': 'deploy last commit',
            '--hooks': 'git commit hooks.',
            '-c <config>': '指定配置文件路径, 相对于根路径. (默认为根目录下的: "micro-app.deploy.config.js")',
        },
        details: `
Examples:
    ${chalk.gray('# deploy')}
    micro-app deploy
    ${chalk.gray('# git hooks')}
    micro-app deploy --hooks
    ${chalk.gray('# config file')}
    micro-app deploy -c micro-app.deploy.config.js

Config:
    {
        git: '',
        ${chalk.gray('branch: \'\',')}
        branch: {
            name: '',
            extends: true,
        },
        message: '',
        user: {
            name: '',
            email: '',
        },
    }
          `.trim(),
    }, args => {
        const logger = api.logger;

        const isHooks = args.hooks;
        const configFile = args.c || 'micro-app.deploy.config.js';
        const deployConfig = tryRequire(path.resolve(api.root, configFile));

        if (!deployConfig || typeof deployConfig !== 'object') {
            logger.logo(`${chalk.yellow('need "micro-app.deploy.config.js"')}`);
            return;
        }

        const deployCommit = require('./deployCommit');
        return deployCommit(api, isHooks, Object.assign({}, deployConfig, opts));
    });


};

module.exports.configuration = {
    description: '强制发布更新当前提交信息到指定 git 中命令行',
};
