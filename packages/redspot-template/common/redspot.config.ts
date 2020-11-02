import { usePlugin } from "redspot/config";
import { RedspotConfig } from "redspot/types";

usePlugin("@redspot/patract");

export default {
  defaultNetwork: "development",
  rust: {
    toolchain: "nightly",
  },
  networks: {
    development: {
      endpoint: "ws://127.0.0.1:9944",
      types: {
        Address: "AccountId",
        LookupSource: "AccountId",
      },
      gasLimit: "5000000000",
      explorerUrl: "https://polkadot.js.org/apps/#/explorer/query/",
    },
    substrate: {
      endpoint: "ws://127.0.0.1:9944",
      gasLimit: "5000000000",
      accounts: ["//Alice"],
      types: {},
    },
  },
  mocha: {
    timeout: 60000,
  },
} as RedspotConfig;
