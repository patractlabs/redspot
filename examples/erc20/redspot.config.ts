import '@redspot/patract';
import { RedspotConfig } from 'redspot/types';

export default {
  defaultNetwork: 'development',
  rust: {
    toolchain: 'nightly-2020-10-07'
  },
  networks: {
    development: {
      endpoint: 'ws://192.168.1.165:9944',
      types: {
        Address: 'AccountId',
        LookupSource: 'AccountId'
      }
    }
  }
} as RedspotConfig;
