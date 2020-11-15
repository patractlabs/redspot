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

// Networks config

export interface NetworksUserConfig {
  redspot?: RedspotNetworkUserConfig;
  [networkName: string]: NetworkUserConfig | undefined;
}

export type NetworkUserConfig =
  | RedspotNetworkUserConfig
  | HttpNetworkUserConfig;

export interface RedspotNetworkUserConfig {
  chainId?: number;
  from?: string;
  gas?: 'auto' | number;
  gasPrice?: 'auto' | number;
  gasMultiplier?: number;
  hardfork?: string;
  accounts?: RedspotNetworkAccountsUserConfig;
  blockGasLimit?: number;
  throwOnTransactionFailures?: boolean;
  throwOnCallFailures?: boolean;
  allowUnlimitedContractSize?: boolean;
  initialDate?: string;
  loggingEnabled?: boolean;
  forking?: RedspotNetworkForkingUserConfig;
}

export type RedspotNetworkAccountsUserConfig =
  | RedspotNetworkAccountUserConfig[]
  | RedspotNetworkHDAccountsUserConfig;

export interface RedspotNetworkAccountUserConfig {
  privateKey: string;
  balance: string;
}

export interface RedspotNetworkHDAccountsUserConfig {
  mnemonic?: string;
  initialIndex?: number;
  count?: number;
  path?: string;
  accountsBalance?: string;
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

export interface NetworksConfig {
  redspot: RedspotNetworkConfig;
  localhost: HttpNetworkConfig;
  [networkName: string]: NetworkConfig;
}

export type NetworkConfig = RedspotNetworkConfig | HttpNetworkConfig;

export interface RedspotNetworkConfig {
  chainId: number;
  from?: string;
  gas: 'auto' | number;
  gasPrice: 'auto' | number;
  gasMultiplier: number;
  hardfork: string;
  accounts: RedspotNetworkAccountsConfig;
  blockGasLimit: number;
  throwOnTransactionFailures: boolean;
  throwOnCallFailures: boolean;
  allowUnlimitedContractSize: boolean;
  initialDate?: string;
  loggingEnabled: boolean;
  forking?: RedspotNetworkForkingConfig;
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
  sources?: string;
  tests?: string;
}

export interface ProjectPathsConfig {
  root: string;
  configFile: string;
  cache: string;
  artifacts: string;
  sources: string;
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

// Redspot config

export interface RedspotUserConfig {
  defaultNetwork?: string;
  paths?: ProjectPathsUserConfig;
  networks?: NetworksUserConfig;
  solidity?: SolidityUserConfig;
  mocha?: Mocha.MochaOptions;
}

export interface RedspotConfig {
  defaultNetwork: string;
  paths: ProjectPathsConfig;
  networks: NetworksConfig;
  solidity: SolidityConfig;
  mocha: Mocha.MochaOptions;
}

// Plugins config functionality

export type ConfigExtender = (
  config: RedspotConfig,
  userConfig: Readonly<RedspotUserConfig>
) => void;
