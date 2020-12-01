import { RedspotUserConfig } from 'redspot/types';
import '@redspot/patract';
import '@redspot/chai';

export default {
  defaultNetwork: 'development',
  ink: {
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
