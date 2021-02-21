import { RedspotUserConfig } from 'redspot/types';
import '@redspot/patract';
import '@redspot/chai';
import '@redspot/gas-reporter';

export default {
  defaultNetwork: 'development',
  compiler: {
    compilerType: 'ink',
    toolchain: 'nightly'
  },
  networks: {
    development: {
      endpoint: 'ws://127.0.0.1:9944',
      types: {
        Address: 'AccountId',
        LookupSource: 'AccountId'
      },
      gasLimit: '400000000000',
      explorerUrl: 'https://polkadot.js.org/apps/#/explorer/query/'
    },
    substrate: {
      endpoint: 'ws://127.0.0.1:9944',
      gasLimit: '400000000000',
      accounts: ['//Alice'],
      types: {}
    }
  },
  mocha: {
    timeout: 60000
  }
} as RedspotUserConfig;
