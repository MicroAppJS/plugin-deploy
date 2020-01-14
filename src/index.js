'use strict';

module.exports = function DeployCommand(api, opts = {}) {

    api.assertVersion('>=0.3.0');

    // methods
    require('./methods')(api, opts);

    // commands
    require('./commands')(api, opts);

};

module.exports.configuration = {
    description: '自动发布更新命令行',
};
