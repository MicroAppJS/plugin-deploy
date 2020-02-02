'use strict';

module.exports = {
    hooks: {
        'before:init': [
            'npm test',
        ],
    },
    git: {
        commitMessage: 'release: v${version}',
        tagName: 'v${version}',
    },
    github: {
        release: true,
        releaseName: '%s Released!',
    },
    // plugins: {
    //     '@release-it/conventional-changelog': {
    //         preset: 'angular',
    //         infile: 'CHANGELOG.md',
    //     },
    // },
};
