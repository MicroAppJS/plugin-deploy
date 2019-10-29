'use strict';

/* global expect */

process.env.NODE_ENV = 'MICRO_APP_TEST';

const path = require('path');

describe('Command deploy', () => {

    it('deploy', async () => {

        const { service } = require('@micro-app/cli');

        service.registerPlugin({
            id: 'test:DeployCommand',
            link: path.join(__dirname, './index.js'),
        });

        const result = await service.run('deploy');
        console.log(result);
    });

});
