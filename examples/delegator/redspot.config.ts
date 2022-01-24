import { RedspotUserConfig } from 'redspot/types';
import '@redspot/patract';
import '@redspot/chai';
import '@redspot/known-types';
import '@redspot/watcher';
import '@redspot/explorer';
import '@redspot/decimals';

export default {
  defaultNetwork: 'development',
  contract: {
    ink: {
      docker: false,
      toolchain: 'nightly',
      sources: ['contracts/**/*']
    }
  },
  networks: {
    development: {
      endpoint: 'ws://127.0.0.1:9944',
      types: {},
      gasLimit: '400000000000'
    },
    jupiter: {
      endpoint: 'wss://jupiter-poa.elara.patract.io',
      gasLimit: '400000000000',
      accounts: ['//Alice'],
      types: {}
    }
  },
  mocha: {
    timeout: 60000
  }
} as RedspotUserConfig;
