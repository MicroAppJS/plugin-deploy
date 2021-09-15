'use strict';

module.exports = function DeployCommand(api, opts = {}) {

    api.assertVersion('>=0.3.0');

    // deploy
    require('./deploy')(api, opts);

    // release
    require('./release')(api, opts);

};

module.exports.configuration = {
    description: '自动发布更新命令行',
};
