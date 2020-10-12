import { usePlugin } from "@redspot/buidler/config";
import { BuidlerConfig } from "@redspot/buidler/types";

usePlugin("@redspot/buidler-api");

export default {
  defaultNetwork: "development",
  networks: {
    development: {
      endpoint: "ws://192.168.1.165:9944",
      types: {
        Address: "AccountId",
        LookupSource: "AccountId",
      },
    },
  },
} as BuidlerConfig;
