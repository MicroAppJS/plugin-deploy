'use strict';

module.exports = function DeployCommand(api, opts = {}) {

    api.assertVersion('>=0.2.2');

    // methods
    require('./methods')(api, opts);

    // commands
    require('./commands')(api, opts);

};

module.exports.configuration = {
    description: '强制发布更新当前提交信息到指定 git 中命令行',
};
