import { usePlugin } from "redspot/config";
import { RedspotConfig } from "redspot/types";

usePlugin("@redspot/patract");

export default {
  defaultNetwork: "development",
  rust: {
    toolchain: "nightly-2020-10-07",
  },
  networks: {
    development: {
      endpoint: "ws://127.0.0.1:9944",
      types: {
        Address: "AccountId",
        LookupSource: "AccountId",
      },
    },
  },
} as RedspotConfig;
