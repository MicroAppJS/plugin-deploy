'use strict';

const path = require('path');
const { service } = require('@micro-app/cli');

service.registerPlugin({
    id: 'test:DeployCommand',
    link: path.join(__dirname, '../src/commands//deploy/index.js'),
});

(async () => {
    const result = await service.run('deploy');
    console.log(result);
})();
