'use strict';

/* global expect */

process.env.MICRO_APP_TEST = 'true';

describe('Command deploy', () => {

    it('deploy', async () => {

        const { service } = require('@micro-app/cli');

        const result = await service.run('deploy');
        console.log(result);
    });

});
