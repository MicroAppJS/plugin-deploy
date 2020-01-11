'use strict';

const { _, execa } = require('@micro-app/shared-utils');

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
    const { stdout, exitCode } = execa.sync('git', args, Object.assign({ stdio: 'ignore', timeout: TIMEOUT }, options));
    return exitCode === 0 ? (stdout || '').trim() : '';
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
    if (_.isEmpty(userName)) {
        userName = execGitSync([ 'config', 'user.name' ]);
    }
    let userEmail = deployConfig.userEmail;
    if (_.isEmpty(userEmail)) {
        userEmail = execGitSync([ 'config', 'user.email' ]);
    }
    return {
        name: userName || 'Git Deploy Anonymous',
        email: userEmail || 'git-deploy-anonymous@users.noreply.git.com',
    };
}
