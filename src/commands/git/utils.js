'use strict';

const shelljs = require('shelljs');
const { _ } = require('@micro-app/shared-utils');

module.exports = {
    execJS,
    getCurrBranch,
    getGitBranch,
    getGitUser,
};

function execJS(execStr, options = {}) {
    return new Promise((resolve, reject) => {
        shelljs.exec(execStr, Object.assign({ silent: true, async: true, stdio: 'inherit' }, options), function(code, stdout, stderr) {
            if (code && stderr) {
                reject(new Error(stderr));
            } else {
                resolve(stdout);
            }
        });
    });
}

function getCurrBranch() {
    const currBranch = ((shelljs.exec('git rev-parse --abbrev-ref HEAD', { silent: true }) || {}).stdout || '').trim();
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
        userName = ((shelljs.exec('git config user.name', { silent: true }) || {}).stdout || '').trim();
    }
    let userEmail = deployConfig.userEmail;
    if (_.isEmpty(userEmail)) {
        userEmail = ((shelljs.exec('git config user.email', { silent: true }) || {}).stdout || '').trim();
    }
    return {
        name: userName || 'Git Deploy Anonymous',
        email: userEmail || 'git-deploy-anonymous@users.noreply.git.com',
    };
}
