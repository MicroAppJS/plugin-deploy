'use strict';

const { logger, execa, shell } = require('@micro-app/shared-utils');

const TIMEOUT = 1000 * 60 * 3;

module.exports = {
    execGit,
    execGitSync,
    getCurrBranch,
    getGitBranch,
    getGitUser,
};

function execGit(args, options = {}) {
    return new Promise((resolve, reject) => {
        // 'pipe' | 'ignore' | 'inherit'
        execa('git', args, Object.assign({ stdio: 'ignore', timeout: TIMEOUT }, options)).then(({ stdout }) => {
            resolve(stdout);
        }).catch(e => {
            reject(e);
        });
    });
}

function execGitSync(args, options = {}) {
    const cmd = [ 'git' ].concat(args).join(' ');
    const { stdout, code, stderr } = shell.exec(cmd, Object.assign({ stdio: 'ignore', timeout: TIMEOUT, silent: true }, options));
    if (code === 0) { return (stdout || '').trim(); }
    logger.warn('[execGitSync]', stderr || stdout);
    return '';
}

function getCurrBranch() {
    const currBranch = execGitSync([ 'rev-parse', '--abbrev-ref', 'HEAD' ]);
    return currBranch;
}

function getGitBranch(deployConfig) {
    let gitBranch = deployConfig.branch || 'master';
    const currBranch = getCurrBranch();
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
    if (!userName) {
        userName = execGitSync([ 'config', 'user.name' ]);
    }
    let userEmail = deployConfig.userEmail;
    if (!userEmail) {
        userEmail = execGitSync([ 'config', 'user.email' ]);
    }
    return {
        name: userName || 'Git Deploy Anonymous',
        email: userEmail || 'git-deploy-anonymous@users.noreply.git.com',
    };
}
