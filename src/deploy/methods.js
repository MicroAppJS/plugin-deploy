'use strict';

module.exports = function registerMethods(api, opts = {}) {

    api.registerMethod('beforeCommandDeploy', {
        type: api.API_TYPE.EVENT,
        description: '发布前事件',
    });
    api.registerMethod('afterCommandDeploy', {
        type: api.API_TYPE.EVENT,
        description: '发布后事件',
    });
    api.registerMethod('modifyCommandDeployMessage', {
        type: api.API_TYPE.MODIFY,
        description: '发布消息二次编辑事件',
    });

    // others type
    api.registerMethod('addCommandDeployType', {
        type: api.API_TYPE.ADD,
        description: '添加其它类型的发布事件',
    });
};
