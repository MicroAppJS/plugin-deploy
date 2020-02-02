'use strict';

/* global expect */

process.env.MICRO_APP_TEST = 'true';

describe('Command release', () => {

    it('release', async () => {

        const { service } = require('@micro-app/cli');

        const result = await service.run('release');
        console.log(result);
    });

});
