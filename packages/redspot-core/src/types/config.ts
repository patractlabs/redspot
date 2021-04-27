/* eslint-disable no-use-before-define */
// This file defines the different config types.
//
// For each possible kind of config value, we have two type:
//
// One that ends with UserConfig, which represent the config as
// written in the user's config file.
//
// The other one, with the same name except without the User part, represents
// the resolved value as used during the redspot execution.
//
// Note that while many declarations are repeated here (i.e. network types'
// fields), we don't use `extends` as that can interfere with plugin authors
// trying to augment the config types.

import type { ApiOptions } from '@polkadot/api/types';
import type BN from 'bn.js';

// Networks config
export type RedspotNetworkAccountsUserConfig = string[];

export interface RedspotNetworkUserConfig {
  endpoint?: string;
  httpHeaders?: Record<string, string>;
  accounts?: RedspotNetworkAccountsUserConfig;
  gasLimit?: string | number | BN;
  types?: ApiOptions['types'];
  typesAlias?: ApiOptions['typesAlias'];
  typesBundle?: ApiOptions['typesBundle'];
  typesChain?: ApiOptions['typesChain'];
  typesSpec?: ApiOptions['typesSpec'];
  rpc?: ApiOptions['rpc'];
  from?: string;
}
export interface NetworksUserConfig {
  [networkName: string]: NetworkUserConfig | undefined;
}

export type NetworkUserConfig = RedspotNetworkUserConfig;

export type RedspotNetworkConfig = RedspotNetworkUserConfig;

export type NetworkConfig = RedspotNetworkConfig;

export interface NetworksConfig {
  [networkName: string]: RedspotNetworkConfig;
}

export type RedspotNetworkAccountsConfig =
  | RedspotNetworkHDAccountsConfig
  | RedspotNetworkAccountConfig[];

export interface RedspotNetworkAccountConfig {
  privateKey: string;
  balance: string;
}

export interface RedspotNetworkHDAccountsConfig {
  mnemonic: string;
  initialIndex: number;
  count: number;
  path: string;
  accountsBalance: string;
}

export interface RedspotNetworkForkingConfig {
  enabled: boolean;
  url: string;
  blockNumber?: number;
}

export interface HttpNetworkConfig {
  chainId?: number;
  from?: string;
  gas: 'auto' | number;
  gasPrice: 'auto' | number;
  gasMultiplier: number;
  url: string;
  timeout: number;
  httpHeaders: { [name: string]: string };
  accounts: HttpNetworkAccountsConfig;
}

export type HttpNetworkAccountsConfig =
  | 'remote'
  | string[]
  | HttpNetworkHDAccountsConfig;

export interface HttpNetworkHDAccountsConfig {
  mnemonic: string;
  initialIndex: number;
  count: number;
  path: string;
}

// Project paths config

export interface ProjectPathsUserConfig {
  root?: string;
  cache?: string;
  artifacts?: string;
  tests?: string;
}

export interface ProjectPathsConfig {
  root: string;
  configFile: string;
  cache: string;
  artifacts: string;
  tests: string;
}

// Solidity config

export type SolidityUserConfig = string | SolcUserConfig | MultiSolcUserConfig;

export interface SolcUserConfig {
  version: string;
  settings?: any;
}

export interface MultiSolcUserConfig {
  compilers: SolcUserConfig[];
  overrides?: Record<string, SolcUserConfig>;
}

export interface SolcConfig {
  version: string;
  settings: any;
}

export interface SolidityConfig {
  compilers: SolcConfig[];
  overrides: Record<string, SolcConfig>;
}

export type ContractType = 'ink' | 'solang';

export interface InkConfig {
  version?: string;
  toolchain: string;
  docker?: boolean;
  sources: string[];
}

export interface SolangConfig {
  version?: string;
  sources: string[];
}

export interface ContractConfig {
  ink: InkConfig;
  solang?: SolangConfig;
}

export interface ContractUserConfig {
  ink?: InkConfig;
  solang?: SolangConfig;
}

export type CompilerConfig = InkConfig | SolangConfig;
// Redspot config

export interface RedspotUserConfig {
  defaultNetwork?: string;
  paths?: ProjectPathsUserConfig;
  networks?: NetworksUserConfig;
  mocha?: Mocha.MochaOptions;
  contract?: ContractUserConfig;
}

export interface RedspotConfig {
  defaultNetwork: string;
  paths: ProjectPathsConfig;
  networks: NetworksConfig;
  mocha: Mocha.MochaOptions;
  contract: ContractConfig;
}

// Plugins config functionality

export type ConfigExtender = (
  config: RedspotConfig,
  userConfig: Readonly<RedspotUserConfig>
) => void;

export type HttpNetworkAccountsUserConfig =
  | 'remote'
  | string[]
  | HDAccountsUserConfig;

export interface HttpNetworkUserConfig {
  chainId?: number;
  from?: string;
  gas?: 'auto' | number;
  gasPrice?: 'auto' | number;
  gasMultiplier?: number;
  url?: string;
  timeout?: number;
  httpHeaders?: { [name: string]: string };
  accounts?: HttpNetworkAccountsUserConfig;
}

export interface HDAccountsUserConfig {
  mnemonic: string;
  initialIndex?: number;
  count?: number;
  path?: string;
}

export interface RedspotNetworkForkingUserConfig {
  enabled?: boolean;
  url: string;
  blockNumber?: number;
}

export interface RedspotNetworkHDAccountsUserConfig {
  mnemonic?: string;
  initialIndex?: number;
  count?: number;
  path?: string;
  accountsBalance?: string;
}
