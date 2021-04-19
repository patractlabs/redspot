import { RedspotUserConfig } from 'redspot/types';
import '@redspot/patract';
import '@redspot/chai';
import '@redspot/gas-reporter';
import '@redspot/known-types';

export default {
  defaultNetwork: 'development',
  contract: {
    ink: {
      docker: true,
      toolchain: 'nightly',
      sources: ['contracts/**']
    }
  },
  networks: {
    development: {
      endpoint: 'ws://127.0.0.1:9944',
      types: {},
      gasLimit: '400000000000',
      explorerUrl:
        'https://polkadot.js.org/apps/#/explorer/query/?rpc=ws://127.0.0.1:9944/'
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
