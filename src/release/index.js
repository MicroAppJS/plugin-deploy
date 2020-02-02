'use strict';

// TODO release-it

// https://www.npmjs.com/package/release-it

module.exports = function(api, opts = {}) {

    const registerMethods = require('./methods');
    registerMethods(api);

    const { _, chalk } = require('@micro-app/shared-utils');

    api.registerCommand('release', {
        description: 'release it.',
        usage: 'micro-app release [options]',
        options: {
            '--config': 'Path to local configuration options [default: "release.js"]',
            '--dry-run': 'Do not touch or write anything, but show the commands',
            '--help': 'Print this help',
            '--increment': 'Increment "major", "minor", "patch", or "pre*" version; or specify version [default: "patch"]',
            '--ci': 'No questions asked. Activated automatically in CI environments.',
            '--non-interactive': 'Same as --ci',
            '--version': 'Print version number',
            '--verbose': 'Verbose output',
        },
        details: `
Examples:
    ${chalk.gray('# release')}
    micro-app release
    ${chalk.gray('# config file')}
    micro-app release --config micro-app.release.config.js
        `.trim(),
    }, args => {
        const logger = api.logger;

        if (args.help) {
            return api.runCommand('help', { _: [ 'release' ] });
        }

        let releaseConfig = args.config || api.parseConfig('release');
        if (releaseConfig && !_.isString(releaseConfig)) {
            releaseConfig = releaseConfig[Symbol.for('filepath')];
        }

        delete args.c;
        args.config = releaseConfig;
        args.increment = args._[0] || args.increment;

        logger.info('[Release]', 'config:', args.config);

        let chain = Promise.resolve();

        if (process.env.MICRO_APP_TEST) {
            api.logger.debug('MICRO_APP_TEST --> Exit!!!');
            return chain;
        }

        chain = chain.then(() => api.applyPluginHooks('beforeCommandRelease', { args }));

        chain = chain.then(() => {
            const release = require('release-it');
            return release(args);
        });

        chain = chain.then(() => api.applyPluginHooks('afterCommandRelease', { args }));

        return chain.catch(e => {
            logger.throw('[Deploy]', e);
        });
    });

};
