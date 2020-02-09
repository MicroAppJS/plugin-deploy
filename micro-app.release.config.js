'use strict';

// demo config
module.exports = {
    hooks: {
        'before:init': [
            'npm test',
        ],
    },
    git: {
        commitMessage: 'chore: release v%s',
        tagName: 'v%s',
        push: false,
    },
    npm: {
        publish: true,
    },
    github: {
        release: true,
        releaseName: 'v%s Released!',
    },
    plugins: {
        '@release-it/conventional-changelog': {
            preset: 'angular',
            infile: 'CHANGELOG.md',
        },
    },
};
