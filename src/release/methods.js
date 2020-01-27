'use strict';

module.exports = function registerMethods(api, opts = {}) {

    api.registerMethod('beforeCommandRelease', {
        type: api.API_TYPE.EVENT,
        description: '发布前事件',
    });
    api.registerMethod('afterCommandRelease', {
        type: api.API_TYPE.EVENT,
        description: '发布后事件',
    });
};
