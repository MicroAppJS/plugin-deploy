'use strict';

const path = require('path');
const { fs, _, chalk, Env } = require('@micro-app/shared-utils');
const CONSTANTS = require('../../constants');
const { execGit, execGitSync, getCurrBranch, getGitBranch, getGitUser } = require('./utils');

function createCNAMEFile({ deployConfig, deployDir }) {
    const cname = deployConfig.cname;
    if (!_.isEmpty(cname) && _.isString(cname)) {
        const filepath = path.resolve(deployDir, 'CNAME');
        fs.writeFileSync(filepath, cname, 'utf8');
    }
}

async function setup(api, { deployDir, gitUser }) {
    await fs.ensureDir(deployDir);
    await fs.emptyDir(deployDir);

    await execGit([ 'init' ], { cwd: deployDir });

    // git config
    if (gitUser.name && typeof gitUser.name === 'string') {
        await execGit([ 'config', 'user.name', gitUser.name ], { cwd: deployDir });
    }
    if (gitUser.email && typeof gitUser.email === 'string') {
        await execGit([ 'config', 'user.email', gitUser.email ], { cwd: deployDir });
    }
}

async function clone(api, { deployDir, gitURL, gitBranch }) {
    return await execGit([ 'clone', gitURL, '-b', gitBranch, deployDir ], { cwd: deployDir });
}

function gitPush(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage, name }) {
    const currBranch = getCurrBranch();
    // commit + push
    const { message } = api.applyPluginHooks('modifyCommandDeployMessage', {
        args, config: deployConfig,
        message: `:rocket: auto deploy from ${name} [${currBranch || gitBranch}] - ${commitHash.substr(0, 8)}${gitMessage}`,
        branch: gitBranch,
        gitMessage,
        commitHash,
        name,
    });

    if (_.isEmpty(message)) {
        throw new Error('modifyCommandDeployMessage() must be retrun { message } !!!');
    }

    let chain = Promise.resolve();

    if (process.env.MICRO_APP_TEST) {
        api.logger.debug('MICRO_APP_TEST --> Exit!!!');
        return chain;
    }

    chain = chain.then(() => execGit([ 'add', '-A' ], { cwd: deployDir }));
    chain = chain.then(() => execGit([ 'commit', '-a', '-m', message ], { cwd: deployDir }));
    chain = chain.then(() => execGit([ 'push', '-u', gitURL, `HEAD:${gitBranch}`, '--force' ], { cwd: deployDir }));

    return chain;
}

function getCommitHash(api, { isHooks, gitBranch }) {
    let commitHash = '';
    if (isHooks) {
        commitHash = execGitSync([ 'rev-parse', '--verify', 'HEAD' ]);
    } else {
        commitHash = execGitSync([ 'rev-parse', `origin/${gitBranch}` ]);
    }
    return commitHash;
}

function getGitMessage(api, { deployConfig, commitHash }) {
    let gitMessage = deployConfig.message && ` | ${deployConfig.message}` || '';
    if (!gitMessage) {
        const msg = execGitSync([ 'log', '--pretty=format:“%s”', commitHash, '-1' ]);
        if (msg) {
            gitMessage = ` | ${msg}`;
        }
    }
    return gitMessage;
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
        await setup(api, { deployDir, gitUser });

        const hasDist = deployConfig.dest;
        let bModify = false;
        if (!hasDist) { // 需要 clone, 且自动修改 package.json
            spinner.text = 'Cloning...';
            await clone(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser });
            spinner.text = 'Modify files...';
            const modifyFile = require('./modifyFile');
            bModify = modifyFile(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage });
        } else { // copy dest to deployDir
            const opts = {};
            spinner.text = 'Copying files from dest folder...';
            await fs.copy(hasDist, deployDir, opts);
            bModify = true;
        }

        // 如果是发布到自定义域名, cname
        createCNAMEFile({ deployConfig, deployDir });

        if (bModify) {
            spinner.text = 'Push files...';
            await gitPush(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage, name: MICRO_APP_CONFIG_NAME });
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

    if (!Env.hasGit()) {
        logger.throw('Sorry, this script requires git');
    }

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

        const commitHash = getCommitHash(api, { isHooks, gitBranch });
        if (_.isEmpty(commitHash)) {
            logger.warn('Not Found commit Hash!');
            return;
        }

        const gitMessage = getGitMessage(api, { deployConfig, commitHash });

        const gitRoot = path.resolve(root, CONSTANTS.GIT_NAME);
        if (!fs.existsSync(gitRoot)) {
            fs.mkdirpSync(gitRoot);
        }
        const deployDir = path.resolve(gitRoot, CONSTANTS.GIT_SCOPE_NAME);

        const params = { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage };
        const bSuccessful = await runDeploy(api, params);

        // 清空
        if (fs.existsSync(deployDir)) {
            fs.removeSync(deployDir);
        }

        if (!bSuccessful) {
            logger.error(`Fail${index && ` [${index}]`}! Check your config, please!`);
            process.exit(1);
        }

        return params;
    }));
};
