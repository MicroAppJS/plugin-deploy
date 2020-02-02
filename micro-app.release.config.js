'use strict';

// demo config
module.exports = {
    hooks: {
        'before:init': [
            'npm test',
        ],
    },
    git: {
        commitMessage: 'chore: release %s',
        tagName: 'v%s',
    },
    npm: {
        publish: true,
    },
    github: {
        release: true,
        releaseName: '%s Released!',
    },
    plugins: {
        '@release-it/conventional-changelog': {
            preset: 'angular',
            infile: 'CHANGELOG.md',
        },
    },
};
