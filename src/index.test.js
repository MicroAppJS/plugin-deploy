'use strict';

/* global expect */

const MicroApp = require('@micro-app/core');
const Service = MicroApp.Service;
const path = require('path');

describe('Plugin DeployCommand', () => {

    it('DeployCommand', () => {
        const service = new Service();
        service.registerPlugin({
            id: 'test:DeployCommand',
            link: path.join(__dirname, './index.js'),
        });

        service.run('help', { _: [] });
    });

});
