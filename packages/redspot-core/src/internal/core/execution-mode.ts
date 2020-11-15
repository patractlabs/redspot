import * as fs from 'fs';

import { getPackageJsonPath } from '../util/packageInfo';

/**
 * Returns true if Redspot is installed locally or linked from its repository,
 * by looking for it using the node module resolution logic.
 *
 * If a config file is provided, we start looking for it from it. Otherwise,
 * we use the current working directory.
 */
export function isRedspotInstalledLocallyOrLinked(configPath?: string) {
  try {
    const resolvedPackageJson = require.resolve('redspot/package.json', {
      paths: [configPath ?? process.cwd()]
    });

    const thisPackageJson = getPackageJsonPath();

    // We need to get the realpaths here, as redspot may be linked and
    // running with `node --preserve-symlinks`
    return (
      fs.realpathSync(resolvedPackageJson) === fs.realpathSync(thisPackageJson)
    );
  } catch (_) {
    return false;
  }
}

/**
 * Checks whether we're using Redspot in development mode (that is, we're working _on_ Redspot).
 */
export function isLocalDev(): boolean {
  // TODO: This may give a false positive under yarn PnP
  return isRunningRedspotCoreTests() || !__filename.includes('node_modules');
}

export function isRunningRedspotCoreTests(): boolean {
  return __filename.endsWith('.ts');
}
