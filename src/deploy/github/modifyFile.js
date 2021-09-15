'use strict';

const path = require('path');
const { fs, tryRequire } = require('@micro-app/shared-utils');

module.exports = modifyFile;

// TODO 需要匹配新版本
function modifyFile(api, { args, deployConfig, deployDir, gitURL, gitBranch, commitHash, gitUser, gitMessage }) {
    const logger = api.logger;
    const microAppConfig = api.selfConfig;

    const pkgPath = path.resolve(deployDir, 'package.json');
    logger.info('[Deploy]', `modify file "${pkgPath}"`);

    const pkg = tryRequire(pkgPath) || {};
    const { dependencies = {}, devDependencies = {} } = pkg;
    const deps = Object.assign({}, dependencies, devDependencies);

    const MICRO_APP_CONFIG_NAME = microAppConfig.packageName;
    if (deps[MICRO_APP_CONFIG_NAME]) {
        const gitp = deps[MICRO_APP_CONFIG_NAME];
        // update
        const ngitp = gitp.replace(/#[-_\d\w]+$/igm, `#${commitHash}`);

        if (gitp === ngitp) { // not change
            return false;
        }
        if (ngitp) {
            if (dependencies[MICRO_APP_CONFIG_NAME]) {
                dependencies[MICRO_APP_CONFIG_NAME] = ngitp;
            }
            if (devDependencies[MICRO_APP_CONFIG_NAME]) {
                devDependencies[MICRO_APP_CONFIG_NAME] = ngitp;
            }
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), 'utf8');

            return true;
        }
    }

    return false;
}
