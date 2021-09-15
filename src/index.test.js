'use strict';

/* global expect */


describe('Plugin DeployCommand', () => {

    it('release', async () => {
        const { service } = require('@micro-app/cli');
        await service.run('help', { _: [ 'release' ] });
    });

    it('deploy', async () => {
        const { service } = require('@micro-app/cli');
        await service.run('help', { _: [ 'deploy' ] });
    });

});
