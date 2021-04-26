import { REDSPOT_NETWORK_NAME } from '../../constants';

export const REDSPOT_NETWORK_DEFAULT_GAS_PRICE = '400000000000';
export const DEFAULT_REDSPOT_NETWORK_BALANCE = '10000000000000000000000';

export const defaultDefaultNetwork = REDSPOT_NETWORK_NAME;

export const defaultEuropaNetworkParams = {
  gasLimit: REDSPOT_NETWORK_DEFAULT_GAS_PRICE,
  accounts: ['//Alice', '//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie'],
  endpoint: ['ws://127.0.0.1:9944'],
  types: {},
  httpHeaders: {}
};

export const defaultLocalhostNetworkParams = {
  gasLimit: REDSPOT_NETWORK_DEFAULT_GAS_PRICE,
  accounts: ['//Alice', '//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie'],
  endpoint: ['ws://127.0.0.1:9944'],
  types: {},
  httpHeaders: {}
};

export const defaultMochaOptions: Mocha.MochaOptions = {
  timeout: 20000
};

export const defaultInkConfig = {
  version: 'v0.8.0',
  toolchain: 'nightly',
  docker: false,
  sources: ['**/*']
};

export const defaultSolangConfig = {
  sources: ['**/*.sol']
};
