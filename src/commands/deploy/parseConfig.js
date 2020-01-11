'use strict';

const _ = require('lodash');
const path = require('path');
const tryRequire = require('try-require');
const CONSTANTS = require('../../constants');

const rRepoURL = /^(?:(?:git|https?|git\+https|git\+ssh):\/\/)?(?:[^@]+@)?([^\/]+?)[\/:](.+?)\.git$/;
const rGithubPage = /\.github\.(io|com)$/;

function parseRepo(repo) {
    const split = repo.split(',');
    const url = split.shift();
    let branch = split[0];

    if (!branch && rRepoURL.test(url)) {
        const match = url.match(rRepoURL);
        const host = match[1];
        const path = match[2];

        if (host === 'github.com') {
            branch = rGithubPage.test(path) ? 'master' : 'gh-pages';
        } else if (host === 'coding.net') {
            branch = 'coding-pages';
        }
    }

    return {
        url,
        branch: branch || 'master',
    };
}

function parseConfig(deployConfig, api, args) {
    const repository = deployConfig.repository || deployConfig.repo || deployConfig.git;
    if (_.isEmpty(repository)) {
        api.logger.error('repository is required!');
        return null;
    }

    const type = deployConfig.type || 'git';
    const disabled = deployConfig.disabled || deployConfig.disable || false;
    const message = args.m || args.msg || args.message || deployConfig.message || '';

    const userName = args.name || args.userName || _.get(deployConfig, 'user.name') || process.env.GITHUB_ACTOR || '';
    const userEmail = args.email || args.userEmail || _.get(deployConfig, 'user.email') || '';

    const cname = deployConfig.cname || deployConfig.CNAME || false;

    // dest，dist 相同
    const dest = args.dest || deployConfig.dest || false;
    const dist = dest || args.dist || deployConfig.dist || false;

    const _otherConfig = {
        type, disabled,
        message,
        userName,
        userEmail,
        cname,
        dest: dist,
    };

    const data = parseRepo(repository);
    let branch = args.branch;
    if (_.isEmpty(branch)) {
        if (_.isString(deployConfig.branch)) {
            branch = deployConfig.branch;
        } else {
            branch = _.get(deployConfig, 'branch.name') || data.branch;
        }
    }
    data.branch = branch;
    data.extends = _.get(deployConfig, 'branch.extends') || false;
    return Object.assign(data, _otherConfig);
}

module.exports = function(api, args, opts) {
    const configFile = args.config;
    let deployConfig;
    if (!_.isEmpty(configFile) && _.isString(configFile)) {
        deployConfig = tryRequire(path.resolve(api.root, configFile));
    }
    if (_.isEmpty(deployConfig)) {
        deployConfig = api.parseConfig(CONSTANTS.NAME);
    }
    if (_.isEmpty(deployConfig) || !_.isPlainObject(deployConfig)) {
        api.logger.warn('没有找到可用的配置文件信息, 将使用默认配置.');
    }

    // parse config
    if (Array.isArray(deployConfig)) {
        const result = deployConfig.map(item => {
            const _config = Object.assign({}, opts, item || {});
            if (_.isEmpty(_config)) return null;
            return parseConfig(item, api, args);
        }).filter(item => !!item);
        if (_.isEmpty(result)) return null;
        return result;
    }

    const _config = Object.assign({}, opts, deployConfig || {});
    if (_.isEmpty(_config)) return null;
    const data = parseConfig(_config, api, args);
    return [ data ];
};
