import { usePlugin } from "redspot/config";
import { RedspotConfig } from "redspot/types";

usePlugin("@redspot/api");

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
} as RedspotConfig;
