'use strict';

// demo config
module.exports = {
    hooks: {
        'before:init': [
            'npm test',
        ],
    },
    git: {
        commitMessage: 'bookmark: release v${version}',
        tagName: 'v${version}',
        // requireUpstream: false,
        // push: false,
    },
    npm: {
        publish: true,
    },
    github: {
        release: true,
        releaseName: ':rocket: v${version} Released!',
    },
    plugins: {
        '@release-it/conventional-changelog': {
            preset: 'angular',
            infile: 'CHANGELOG.md',
        },
    },
};
