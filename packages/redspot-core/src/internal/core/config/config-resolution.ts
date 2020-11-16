import * as fs from 'fs';
import cloneDeep from 'lodash/cloneDeep';
import path from 'path';
import {
  HDAccountsUserConfig,
  HttpNetworkAccountsConfig,
  HttpNetworkAccountsUserConfig,
  HttpNetworkConfig,
  HttpNetworkUserConfig,
  NetworksConfig,
  NetworksUserConfig,
  NetworkUserConfig,
  ProjectPathsConfig,
  ProjectPathsUserConfig,
  RedspotConfig,
  RedspotNetworkAccountsConfig,
  RedspotNetworkConfig,
  RedspotNetworkForkingConfig,
  RedspotNetworkUserConfig,
  RedspotUserConfig
} from '../../../types';
import { REDSPOT_NETWORK_NAME } from '../../constants';
import { fromEntries } from '../../util/lang';
import { assertRedspotInvariant } from '../errors';
import {
  defaultDefaultNetwork,
  defaultHdAccountsConfigParams,
  defaultHttpNetworkParams,
  defaultLocalhostNetworkParams,
  defaultMochaOptions,
  defaultRedspotNetworkHdAccountsConfigParams,
  defaultRedspotNetworkParams
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
    mocha: resolveMochaConfig(userConfig)
  };
}

function resolveNetworksConfig(
  networksConfig: NetworksUserConfig = {}
): NetworksConfig {
  const redspotNetworkConfig = networksConfig[REDSPOT_NETWORK_NAME];

  const localhostNetworkConfig =
    (networksConfig.localhost as HttpNetworkUserConfig) ?? undefined;

  const redspot = resolveRedspotNetworkConfig(redspotNetworkConfig);
  const localhost = resolveHttpNetworkConfig({
    ...cloneDeep(defaultLocalhostNetworkParams),
    ...localhostNetworkConfig
  });

  const otherNetworks: { [name: string]: HttpNetworkConfig } = fromEntries(
    Object.entries(networksConfig)
      .filter(
        ([name, config]) =>
          name !== 'localhost' &&
          name !== 'redspot' &&
          config !== undefined &&
          isHttpNetworkConfig(config)
      )
      .map(([name, config]) => [
        name,
        resolveHttpNetworkConfig(config as HttpNetworkUserConfig)
      ])
  );

  return {
    redspot,
    localhost,
    ...otherNetworks
  };
}

function isHttpNetworkConfig(
  config: NetworkUserConfig
): config is HttpNetworkUserConfig {
  return 'url' in config;
}

function normalizeHexString(str: string): string {
  const normalized = str.trim().toLowerCase();
  if (normalized.startsWith('0x')) {
    return normalized;
  }

  return `0x${normalized}`;
}

function resolveRedspotNetworkConfig(
  redspotNetworkConfig: RedspotNetworkUserConfig = {}
): RedspotNetworkConfig {
  const clonedDefaultRedspotNetworkParams = cloneDeep(
    defaultRedspotNetworkParams
  );

  const accounts: RedspotNetworkAccountsConfig =
    redspotNetworkConfig.accounts === undefined
      ? defaultRedspotNetworkHdAccountsConfigParams
      : Array.isArray(redspotNetworkConfig.accounts)
      ? redspotNetworkConfig.accounts.map(({ privateKey, balance }) => ({
          privateKey: normalizeHexString(privateKey),
          balance
        }))
      : {
          ...defaultRedspotNetworkHdAccountsConfigParams,
          ...redspotNetworkConfig.accounts
        };

  const forking: RedspotNetworkForkingConfig | undefined =
    redspotNetworkConfig.forking !== undefined
      ? {
          url: redspotNetworkConfig.forking.url,
          enabled: redspotNetworkConfig.forking.enabled ?? true
        }
      : undefined;

  const blockNumber = redspotNetworkConfig?.forking?.blockNumber;
  if (blockNumber !== undefined && forking !== undefined) {
    forking.blockNumber = redspotNetworkConfig?.forking?.blockNumber;
  }

  const config = {
    ...clonedDefaultRedspotNetworkParams,
    ...redspotNetworkConfig,
    accounts,
    forking
  };

  // We do it this way because ts gets lost otherwise
  if (config.forking === undefined) {
    delete config.forking;
  }

  return config;
}

function isHdAccountsConfig(
  accounts: HttpNetworkAccountsUserConfig
): accounts is HDAccountsUserConfig {
  return typeof accounts === 'object' && !Array.isArray(accounts);
}

function resolveHttpNetworkConfig(
  networkConfig: HttpNetworkUserConfig
): HttpNetworkConfig {
  const accounts: HttpNetworkAccountsConfig =
    networkConfig.accounts === undefined
      ? defaultHttpNetworkParams.accounts
      : isHdAccountsConfig(networkConfig.accounts)
      ? {
          ...defaultHdAccountsConfigParams,
          ...networkConfig.accounts
        }
      : Array.isArray(networkConfig.accounts)
      ? networkConfig.accounts.map(normalizeHexString)
      : 'remote';

  const url = networkConfig.url;

  assertRedspotInvariant(
    url !== undefined,
    'Invalid http network config provided. URL missing.'
  );

  return {
    ...cloneDeep(defaultHttpNetworkParams),
    ...networkConfig,
    accounts,
    url
  };
}

function resolveMochaConfig(userConfig: RedspotUserConfig): Mocha.MochaOptions {
  return {
    ...cloneDeep(defaultMochaOptions),
    ...userConfig.mocha
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
    sources: resolvePathFrom(root, 'contracts', userPaths.sources),
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
