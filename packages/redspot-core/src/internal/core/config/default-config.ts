import { REDSPOT_NETWORK_NAME } from '../../constants';

export const REDSPOT_NETWORK_DEFAULT_GAS_PRICE = 400000000000n;
export const DEFAULT_REDSPOT_NETWORK_BALANCE = '10000000000000000000000';

export const defaultDefaultNetwork = REDSPOT_NETWORK_NAME;

export const defaultRedspotNetworkParams = {
  gasLimit: REDSPOT_NETWORK_DEFAULT_GAS_PRICE,
  accounts: ['//Alice', '//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie'],
  endpoint: ['ws://127.0.0.1:9944'],
  types: {},
  httpHeaders: {},
  explorerUrl: 'https://polkadot.js.org/apps/#/explorer/query/'
};

export const defaultMochaOptions: Mocha.MochaOptions = {
  timeout: 20000
};
