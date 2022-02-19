import { RedspotUserConfig } from "redspot/types";
import "@redspot/patract";
import "@redspot/chai";
// import "@redspot/gas-reporter";
// import "@redspot/known-types";
import "@redspot/watcher";
import "@redspot/explorer";
import "@redspot/decimals";

export default {
  defaultNetwork: "development",
  contract: {
    ink: {
      docker: false,
      toolchain: "nightly",
      sources: ["contracts/**/*"],
    },
  },
  networks: {
    development: {
      endpoint: "ws://127.0.0.1:9944",
      gasLimit: "200000000000",
      types: {},
    },
    prod: {
      endpoint: 'ws://127.0.0.1:9944',
      gasLimit: '200000000000',
      accounts: ['//Alice'],
      types: {}
    }
  },
  mocha: {
    timeout: 60000,
  },
  docker: {
    sudo: false,
    runTestnet:
      "docker run -p 9944:9944 --rm redspot/contract /bin/bash -c 'canvas --rpc-cors all --tmp --dev --ws-port=9944 --ws-external'",
  },
} as RedspotUserConfig;
