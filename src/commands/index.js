'use strict';

const commands = [
    'deploy',
];

module.exports = function(...args) {
    commands.map(key => require(`./${key}`)).forEach(fn => {
        fn && fn(...args);
    });
};
