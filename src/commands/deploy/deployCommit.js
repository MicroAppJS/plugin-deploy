'use strict';

const shelljs = require('shelljs');
const path = require('path');
const { fs, _, chalk, tryRequire } = require('@micro-app/shared-utils');
const CONSTANTS = require('../../constants');

function execJS(execStr, options = {}) {
    return new Promise((resolve, reject) => {
        shelljs.exec(execStr, Object.assign({ silent: true, async: true }, options), function(code, stdout, stderr) {
            if (code && stderr) {
                reject(new Error(stderr));
            } else {
                resolve(stdout);
            }
        });
    });
}

function getGitBranch(deployConfig) {
    let gitBranch = deployConfig.branch || 'master';
    const currBranch = ((shelljs.exec('git rev-parse --abbrev-ref HEAD', { silent: true }) || {}).stdout || '').trim();
    // 继承当前分支
    if (currBranch && deployConfig.extends === true) {
        gitBranch = currBranch;
    } else if (deployConfig.branch) {
        gitBranch = deployConfig.branch;
    } else {
        gitBranch = 'master';
    }
    return gitBranch;
}

function getGitUser(deployConfig) {
    let userName = deployConfig.userName;
    if (_.isEmpty(userName)) {
        userName = ((shelljs.exec('git config user.name', { silent: true }) || {}).stdout || '').trim();
    }
    let userEmail = deployConfig.userEmail;
    if (_.isEmpty(userEmail)) {
        userEmail = ((shelljs.exec('git config user.email', { silent: true }) || {}).stdout || '').trim();
    }
    return {
        name: userName || '',
        email: userEmail || '',
    };
}

function createCNAMEFile({ deployConfig, deployDir }) {
    const cname = deployConfig.cname;
    if (!_.isEmpty(cname) && _.isString(cname)) {
        const filepath = path.resolve(deployDir, 'CNAME');
        fs.writeFileSync(filepath, cname, 'utf8');
    }
}

function modifyFile(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage }) {
    const logger = api.logger;
    const microAppConfig = api.self;

    const pkgPath = path.resolve(deployDir, 'package.json');
    const pkg = tryRequire(pkgPath) || {};
    const { dependencies = {}, devDependencies = {} } = pkg;
    const deps = Object.assign({}, dependencies, devDependencies);

    const MICRO_APP_CONFIG_NAME = microAppConfig.packageName;
    if (deps[MICRO_APP_CONFIG_NAME]) {
        const gitp = deps[MICRO_APP_CONFIG_NAME];
        // update
        const ngitp = gitp.replace(/#[-_\d\w]+$/igm, `#${commitHash}`);

        if (gitp === ngitp) { // not change
            return false;
        }
        if (ngitp) {
            if (dependencies[MICRO_APP_CONFIG_NAME]) {
                dependencies[MICRO_APP_CONFIG_NAME] = ngitp;
            }
            if (devDependencies[MICRO_APP_CONFIG_NAME]) {
                devDependencies[MICRO_APP_CONFIG_NAME] = ngitp;
            }
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), 'utf8');

            return true;
        }
    }

    return false;
}

async function clone(api, { deployDir, gitURL, gitBranch }) {
    const execStr = `git clone "${gitURL}" -b ${gitBranch} "${deployDir}"`;
    return await execJS(execStr);
}

async function push(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage, name }) {
    // git config
    if (gitUser.name && typeof gitUser.name === 'string') {
        await execJS(`git config user.name ${gitUser.name}`, { cwd: deployDir });
    }
    if (gitUser.email && typeof gitUser.email === 'string') {
        await execJS(`git config user.email ${gitUser.email}`, { cwd: deployDir });
    }
    // commit + push
    const { message } = api.applyPluginHooks('modifyCommandDeployMessage', {
        args, config: deployConfig,
        message: `:rocket: auto deploy from ${name} [${gitBranch}] - ${commitHash.substr(0, 8)}${gitMessage}`,
        branch: gitBranch,
        gitMessage,
        commitHash,
        name,
    });

    if (_.isEmpty(message)) {
        throw new Error('modifyCommandDeployMessage() must be retrun { message } !!!');
    }

    if (process.env.NODE_ENV === 'MICRO_APP_TEST') {
        api.logger.debug('MICRO_APP_TEST --> Exit!!!');
        return;
    }

    await execJS('git add -A', { cwd: deployDir });
    await execJS(`git commit -a -m "${message}"`, { cwd: deployDir });
    await execJS(`git push -u "${gitURL}" HEAD:${gitBranch} --force`, { cwd: deployDir });
}

async function setup(deployDir) {
    if (!fs.existsSync(deployDir)) {
        fs.mkdirpSync(deployDir);
    }
    await fs.emptyDir(deployDir);

    const execStr = 'git init';
    return await execJS(execStr, { cwd: deployDir });
}

async function runDeploy(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage }) {
    const logger = api.logger;
    const microAppConfig = api.self;
    const MICRO_APP_CONFIG_NAME = microAppConfig.packageName;

    logger.logo(`Deploy: ${chalk.blueBright(gitURL)}`);
    logger.logo(`Branch: ${chalk.blueBright(gitBranch)}`);
    logger.logo(`Hash: ${chalk.blueBright(commitHash)}`);
    logger.logo(`Name: ${chalk.blueBright(gitUser.name)}`);
    logger.logo(`Email: ${chalk.blueBright(gitUser.email)}`);

    const spinner = logger.spinner('Auto Deploy...');
    spinner.start();
    try {
        await setup(deployDir);
        const hasDist = deployConfig.dist;
        let bModify = false;
        if (!hasDist) { // 需要 clone
            spinner.text = 'Cloning...';
            await clone(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser });
            spinner.text = 'Modify files...';
            bModify = modifyFile(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage });
        } else { // copy dist to deployDir
            const opts = {};
            spinner.text = 'Copying files from dist folder...';
            await fs.copy(hasDist, deployDir, opts);
            bModify = true;
        }

        // 如果是发布到自定义域名, cname
        createCNAMEFile({ deployConfig, deployDir });

        if (bModify) {
            spinner.text = 'Push files...';
            await push(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage, name: MICRO_APP_CONFIG_NAME });
            spinner.succeed(chalk.green('Success!'));
        } else {
            spinner.succeed(chalk.yellow('NOT MODIFIED!'));
        }
        return true;
    } catch (error) {
        spinner.fail(chalk.red('Fail! ') + chalk.yellow(error.message));
    }
    return false;
}

module.exports = async function deployCommit(api, args, deployConfigs) {
    const logger = api.logger;
    const root = api.root;

    const isHooks = args.hooks;

    return Promise.all(deployConfigs.map(async (deployConfig, index) => {

        const gitURL = deployConfig.url || '';
        if (_.isEmpty(gitURL)) {
            logger.warn('repository is required!');
            return;
        }
        const gitBranch = getGitBranch(deployConfig);
        if (_.isEmpty(gitBranch)) {
            logger.warn('branch is required!');
            return;
        }
        const gitUser = getGitUser(deployConfig);

        let commitHash = '';
        if (isHooks) {
            commitHash = ((shelljs.exec('git rev-parse --verify HEAD', { silent: true }) || {}).stdout || '').trim();
        } else {
            commitHash = ((shelljs.exec(`git rev-parse origin/${gitBranch}`, { silent: true }) || {}).stdout || '').trim();
        }
        if (_.isEmpty(commitHash)) {
            logger.warn('Not Found commit Hash!');
            return;
        }

        let gitMessage = deployConfig.message && ` | ${deployConfig.message}` || '';
        if (!gitMessage) {
            const msg = ((shelljs.exec(`git log --pretty=format:“%s” ${commitHash} -1`, { silent: true }) || {}).stdout || '').trim();
            if (msg) {
                gitMessage = ` | ${msg}`;
            }
        }

        const gitRoot = path.resolve(root, CONSTANTS.GIT_NAME);
        if (!fs.existsSync(gitRoot)) {
            fs.mkdirpSync(gitRoot);
        }
        const deployDir = path.resolve(gitRoot, CONSTANTS.GIT_SCOPE_NAME);

        const params = { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage };

        if (fs.statSync(gitRoot).isDirectory()) {
            const bSuccessful = await runDeploy(api, params);
            if (!bSuccessful) {
                logger.error(`Fail [${index}]! Check your config, please!`);
            }
            // 清空
            if (fs.existsSync(deployDir)) {
                fs.removeSync(deployDir);
            }
        }

        return params;
    }));
};
