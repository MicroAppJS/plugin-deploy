'use strict';

const shelljs = require('shelljs');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

module.exports = function deployCommit(api, args, deployConfig) {
    const logger = api.logger;
    const root = api.root;
    // const micros = api.micros;
    // const microsConfig = api.microsConfig;
    // const currentNodeModules = microAppConfig.nodeModules;
    // const currentPkgInfo = microAppConfig.package;

    api.applyPluginHooks('beforeCommandDeploy', { args, config: deployConfig });

    const isHooks = args.hooks;

    const gitURL = deployConfig.git || '';
    if (!gitURL || typeof gitURL !== 'string') {
        logger.warn('Need "deploy.git: \'ssh://...\'" in "micro-app.config.js"');
        return;
    }
    const gitPath = gitURL.replace(/^git\+/ig, '').split('#')[0];
    let gitBranch = deployConfig.branch || gitURL.split('#')[1] || 'master';
    const currBranch = ((shelljs.exec('git rev-parse --abbrev-ref HEAD', { silent: true }) || {}).stdout || '').trim();
    if (typeof gitBranch === 'object') {
        // 继承当前分支
        if (currBranch && gitBranch.extends === true) {
            gitBranch = currBranch;
        } else if (gitBranch.name) {
            gitBranch = gitBranch.name;
        } else {
            gitBranch = 'master';
        }
    }
    let gitMessage = deployConfig.message && ` | ${deployConfig.message}` || '';

    const gitUser = deployConfig.user || {};
    if (!gitUser.name || typeof gitUser.name !== 'string') {
        gitUser.name = ((shelljs.exec('git config user.name', { silent: true }) || {}).stdout || '').trim();
    }
    if (!gitUser.email || typeof gitUser.email !== 'string') {
        gitUser.email = ((shelljs.exec('git config user.email', { silent: true }) || {}).stdout || '').trim();
    }

    let commitHash = '';
    if (isHooks) {
        commitHash = ((shelljs.exec('git rev-parse --verify HEAD', { silent: true }) || {}).stdout || '').trim();
    } else {
        commitHash = ((shelljs.exec(`git rev-parse origin/${currBranch}`, { silent: true }) || {}).stdout || '').trim();
    }

    if (!commitHash || typeof commitHash !== 'string') {
        logger.warn('Not Found commit Hash!');
        return;
    }

    if (!gitMessage) {
        const msg = ((shelljs.exec(`git log --pretty=format:“%s” ${commitHash} -1`, { silent: true }) || {}).stdout || '').trim();
        if (msg) {
            gitMessage = ` | ${msg}`;
        }
    }

    const gitRoot = path.resolve(root, '.git');
    if (fs.statSync(gitRoot).isDirectory()) {
        const deployDir = path.resolve(gitRoot, 'micro-deploy');
        if (fs.existsSync(deployDir)) {
            shelljs.rm('-rf', deployDir);
        }
        fs.mkdirSync(deployDir);

        if (fs.statSync(deployDir).isDirectory()) {
            return runDeploy(api, args, deployConfig, { deployDir, gitPath, gitBranch, commitHash, gitUser, currBranch, gitMessage }).then(() => {
                if (fs.existsSync(deployDir)) {
                    shelljs.rm('-rf', deployDir);
                }

                api.applyPluginHooks('afterCommandDeploy', { args, config: deployConfig });
            }).catch(() => {
                if (fs.existsSync(deployDir)) {
                    shelljs.rm('-rf', deployDir);
                }
                logger.error('Fail! Check your config, please');

                api.applyPluginHooks('afterCommandDeploy', { args, config: deployConfig });
            });
        }
    }

    logger.warn('Not Found git');

    api.applyPluginHooks('afterCommandDeploy', { args, config: deployConfig });
};


function runDeploy(api, args, deployConfig, { deployDir, gitPath, gitBranch, commitHash, gitUser, currBranch, gitMessage }) {
    const logger = api.logger;
    const microAppConfig = api.self;

    const execStr = `git clone "${gitPath}" -b ${gitBranch} "${deployDir}"`;
    logger.logo(`Deploy: ${chalk.blueBright(gitPath)}`);
    logger.logo(`Branch: ${chalk.blueBright(gitBranch)}`);
    logger.logo(`Hash: ${chalk.blueBright(commitHash)}`);
    logger.logo(`Name: ${chalk.blueBright(gitUser.name)}`);
    logger.logo(`Email: ${chalk.blueBright(gitUser.email)}`);
    const result = shelljs.exec(execStr, { silent: true });
    if (result.code) {
        logger.logo(`${result.code}: ${chalk.yellow(result.stderr.trim().split('\n').reverse()[0])}`);
    } else {
        const pkg = require(path.resolve(deployDir, 'package.json')) || {};
        const { dependencies = {}, devDependencies = {} } = pkg;
        const deps = Object.assign({}, dependencies, devDependencies);

        const MICRO_APP_CONFIG_NAME = microAppConfig.packageName;
        if (deps[MICRO_APP_CONFIG_NAME]) {
            const gitp = deps[MICRO_APP_CONFIG_NAME];
            // update
            const ngitp = gitp.replace(/#[-_\d\w]+$/igm, `#${commitHash}`);

            if (gitp === ngitp) {
                // not change
                logger.warn('NOT MODIFIED!');
                return Promise.resolve();
            }
            if (ngitp) {
                if (dependencies[MICRO_APP_CONFIG_NAME]) {
                    dependencies[MICRO_APP_CONFIG_NAME] = ngitp;
                }
                if (devDependencies[MICRO_APP_CONFIG_NAME]) {
                    devDependencies[MICRO_APP_CONFIG_NAME] = ngitp;
                }
                fs.writeFileSync(path.resolve(deployDir, 'package.json'), JSON.stringify(pkg, null, 4), 'utf8');

                // git config
                if (gitUser.name && typeof gitUser.name === 'string') {
                    shelljs.exec(`git config user.name ${gitUser.name}`, { silent: true, cwd: deployDir });
                }
                if (gitUser.email && typeof gitUser.email === 'string') {
                    shelljs.exec(`git config user.email ${gitUser.email}`, { silent: true, cwd: deployDir });
                }
                // commit + push
                const { message } = api.applyPluginHooks('modifyCommandDeployMessage', {
                    args, config: deployConfig,
                    message: `:package: auto deploy ${MICRO_APP_CONFIG_NAME} - ${currBranch} - ${commitHash.substr(0, 8)}${gitMessage}`,
                    branch: currBranch,
                    gitMessage,
                    commitHash,
                    name: MICRO_APP_CONFIG_NAME,
                });

                if (!message) {
                    logger.error('modifyCommandDeployMessage() must be retrun { message } !!!');
                    return Promise.reject();
                }

                return new Promise((resolve, reject) => {
                    const spinner = logger.spinner('Auto Deploy...');
                    spinner.start();
                    shelljs.exec(`git commit -a -m "${message}"`, { cwd: deployDir }, function(code, stdout, stderr) {
                        if (code === 0) {
                            shelljs.exec('git push', { cwd: deployDir }, function(code, stdout, stderr) {
                                if (code === 0) {
                                    spinner.succeed(chalk.green('Success !'));
                                    return resolve();
                                }
                                spinner.fail(chalk.red('Fail !') + stderr);
                                return reject(stderr);
                            });
                        }
                        spinner.fail(chalk.red('Fail !') + stderr);
                        return reject(stderr);
                    });
                });
            }
        }
    }
    return Promise.resolve();
}
