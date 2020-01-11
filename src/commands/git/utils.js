'use strict';

const { _, execa } = require('@micro-app/shared-utils');

const TIMEOUT = 1000 * 60 * 3;

module.exports = {
    execGit,
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

function getCurrBranch() {
    const currBranch = ((execa.commandSync('git rev-parse --abbrev-ref HEAD', { silent: true }) || {}).stdout || '').trim();
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
        userName = ((execa.commandSync('git config user.name', { silent: true }) || {}).stdout || '').trim();
    }
    let userEmail = deployConfig.userEmail;
    if (_.isEmpty(userEmail)) {
        userEmail = ((execa.commandSync('git config user.email', { silent: true }) || {}).stdout || '').trim();
    }
    return {
        name: userName || 'Git Deploy Anonymous',
        email: userEmail || 'git-deploy-anonymous@users.noreply.git.com',
    };
}
