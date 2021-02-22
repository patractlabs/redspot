import * as fs from 'fs';
import cloneDeep from 'lodash/cloneDeep';
import path from 'path';
import {
  HttpNetworkConfig,
  InkConfig,
  NetworksConfig,
  NetworksUserConfig,
  ProjectPathsConfig,
  ProjectPathsUserConfig,
  RedspotConfig,
  RedspotNetworkConfig,
  RedspotNetworkUserConfig,
  RedspotUserConfig
} from '../../../types';
import { REDSPOT_NETWORK_NAME } from '../../constants';
import { fromEntries } from '../../util/lang';
import {
  defaultDefaultNetwork,
  defaultEuropaNetworkParams,
  defaultLocalhostNetworkParams,
  defaultMochaOptions,
  defaultInkConfig,
  defaultSolangConfig
} from './default-config';

/**
 * This functions resolves the redspot config, setting its defaults and
 * normalizing its types if necessary.
 *
 * @param userConfigPath the user config filepath
 * @param userConfig     the user config object
 *
 * @returns the resolved config
 */
export function resolveConfig(
  userConfigPath: string,
  userConfig: RedspotUserConfig
): RedspotConfig {
  userConfig = cloneDeep(userConfig);

  return {
    ...userConfig,
    defaultNetwork: userConfig.defaultNetwork ?? defaultDefaultNetwork,
    paths: resolveProjectPaths(userConfigPath, userConfig.paths),
    networks: resolveNetworksConfig(userConfig.networks),
    mocha: resolveMochaConfig(userConfig),
    contract: resolveContractConfig(userConfig)
  };
}

function resolveNetworksConfig(
  networksConfig: NetworksUserConfig = {}
): NetworksConfig {
  const redspotNetworkConfig = networksConfig[REDSPOT_NETWORK_NAME];

  const localhostNetworkConfig = networksConfig.localhost ?? undefined;

  const europa = resolveEuropaNetworkConfig(redspotNetworkConfig);
  const localhost = {
    ...cloneDeep(defaultLocalhostNetworkParams),
    ...localhostNetworkConfig
  };

  const otherNetworks: { [name: string]: HttpNetworkConfig } = fromEntries(
    Object.entries(networksConfig)
      .filter(
        ([name, config]) =>
          name !== 'localhost' && name !== 'europa' && config !== undefined
      )
      .map(([name, config]) => [name, config])
  );

  return {
    europa,
    localhost,
    ...otherNetworks
  };
}

function resolveEuropaNetworkConfig(
  redspotNetworkConfig: RedspotNetworkUserConfig = {}
): RedspotNetworkConfig {
  const clonedDefaultRedspotNetworkParams = cloneDeep(
    defaultEuropaNetworkParams
  );

  const config = {
    ...clonedDefaultRedspotNetworkParams,
    ...redspotNetworkConfig
  };

  return config;
}

function resolveMochaConfig(userConfig: RedspotUserConfig): Mocha.MochaOptions {
  return {
    ...cloneDeep(defaultMochaOptions),
    ...userConfig.mocha
  };
}

function resolveContractConfig(userConfig: RedspotUserConfig) {
  const _defaultInkConfig = cloneDeep(defaultInkConfig);
  const _defaultSolangConfig = cloneDeep(defaultSolangConfig);

  return {
    ...userConfig.contract,
    ink: {
      ..._defaultInkConfig,
      ...userConfig.contract?.ink
    },
    solang: {
      ..._defaultSolangConfig,
      ...userConfig.contract?.solang
    }
  };
}

/**
 * This function resolves the ProjectPathsConfig object from the user-provided config
 * and its path. The logic of this is not obvious and should well be document.
 * The good thing is that most users will never use this.
 *
 * Explanation:
 *    - paths.configFile is not overridable
 *    - If a path is absolute it is used "as is".
 *    - If the root path is relative, it's resolved from paths.configFile's dir.
 *    - If any other path is relative, it's resolved from paths.root.
 *    - Plugin-defined paths are not resolved, but encouraged to follow the same pattern.
 */
export function resolveProjectPaths(
  userConfigPath: string,
  userPaths: ProjectPathsUserConfig = {}
): ProjectPathsConfig {
  const configFile = fs.realpathSync(userConfigPath);
  const configDir = path.dirname(configFile);

  const root = resolvePathFrom(configDir, '', userPaths.root);

  return {
    ...userPaths,
    root,
    configFile,
    cache: resolvePathFrom(root, 'cache', userPaths.cache),
    artifacts: resolvePathFrom(root, 'artifacts', userPaths.artifacts),
    tests: resolvePathFrom(root, 'tests', userPaths.tests)
  };
}

function resolvePathFrom(
  from: string,
  defaultPath: string,
  relativeOrAbsolutePath: string = defaultPath
) {
  if (path.isAbsolute(relativeOrAbsolutePath)) {
    return relativeOrAbsolutePath;
  }

  return path.join(from, relativeOrAbsolutePath);
}
