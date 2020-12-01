import { RedspotConfig } from '../../types';
import { resolveConfigPath } from './config/config-loading';
import { RedspotError } from './errors';
import { ERRORS } from './errors-list';
import { isRunningRedspotCoreTests } from './execution-mode';

let cachedIsTypescriptSupported: boolean | undefined;

/**
 * Returns true if Redspot will run in using typescript mode.
 * @param configPath The config path if provider by the user.
 */
export function willRunWithTypescript(configPath?: string): boolean {
  const config = resolveConfigPath(configPath);

  return isTypescriptFile(config);
}

/**
 * Returns true if an Redspot is already running with typescript.
 */
export function isRunningWithTypescript(config: RedspotConfig): boolean {
  return isTypescriptFile(config.paths.configFile);
}

export function isTypescriptSupported() {
  if (cachedIsTypescriptSupported === undefined) {
    try {
      // We resolve these from Redspot's installation.
      require.resolve('typescript');
      require.resolve('ts-node');
      cachedIsTypescriptSupported = true;
    } catch {
      cachedIsTypescriptSupported = false;
    }
  }

  return cachedIsTypescriptSupported;
}

export function loadTsNode() {
  try {
    require.resolve('typescript');
  } catch (error) {
    throw new RedspotError(ERRORS.GENERAL.TYPESCRIPT_NOT_INSTALLED);
  }

  try {
    require.resolve('ts-node');
  } catch (error) {
    throw new RedspotError(ERRORS.GENERAL.TS_NODE_NOT_INSTALLED);
  }

  // If we are running tests we just want to transpile
  if (
    isRunningRedspotCoreTests() ||
    process.env.TS_NODE_TRANSPILE_ONLY === undefined
  ) {
    // tslint:disable-next-line no-implicit-dependencies
    require('ts-node/register/transpile-only');

    return;
  }

  // See: https://github.com/nomiclabs/redspot/issues/265
  if (process.env.TS_NODE_FILES === undefined) {
    process.env.TS_NODE_FILES = 'true';
  }

  // tslint:disable-next-line no-implicit-dependencies
  require('ts-node/register');
}

function isTypescriptFile(path: string): boolean {
  return path.endsWith('.ts');
}
