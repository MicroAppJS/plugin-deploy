'use strict';

const path = require('path');
const { service } = require('@micro-app/cli');

service.registerPlugin({
    id: 'test:DeployCommand',
    link: path.join(__dirname, '../src/deploy/index.js'),
});

service.registerPlugin({
    id: 'test:ReleaseCommand',
    link: path.join(__dirname, '../src/release/index.js'),
});

(async () => {
    const result = await service.run('release');
    console.log(result);
})();
