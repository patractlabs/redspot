import { RedspotConfig, NetworkConfig } from "../../../types";
import {
  REDSPOT_DEFAULT_NETWORK_NAME,
  REDSPOT_DEFAULT_TOOLCHAIN,
} from "../../constants";

const DEFAULT_REDSPOT_NETWORK_CONFIG: NetworkConfig = {
  gasLimit: "5000000000",
  accounts: ["//Alice", "//Bob", "//Charlie", "//Dave", "//Eve", "//Ferdie"],
  endpoint: ["ws://127.0.0.1:9944"],
  types: {},
  httpHeaders: {},
  explorerUrl: "https://polkadot.js.org/apps/#/explorer/query/",
};

const defaultConfig: RedspotConfig = {
  defaultNetwork: REDSPOT_DEFAULT_NETWORK_NAME,
  networks: {
    [REDSPOT_DEFAULT_NETWORK_NAME]: DEFAULT_REDSPOT_NETWORK_CONFIG,
  },
  rust: {
    toolchain: REDSPOT_DEFAULT_TOOLCHAIN,
  },
  analytics: {
    enabled: true,
  },
  mocha: {
    timeout: 60000,
  },
};

export default defaultConfig;
