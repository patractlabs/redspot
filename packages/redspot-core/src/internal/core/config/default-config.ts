import { RedspotConfig, NetworkConfig } from "../../../types";
import { REDSPOT_DEFAULT_NETWORK_NAME } from "../../constants";

const DEFAULT_REDSPOT_NETWORK_CONFIG: NetworkConfig = {
  gasLimit: "50000000000",
  endowment: "5000000000000",
  accounts: ["//Alice", "//Bob", "//Charlie", "//Dave", "//Eve", "//Ferdie"],
  endpoint: ["ws://127.0.0.1:9944"],
  types: {},
  autoConnectMs: false,
  httpHeaders: {},
};

const defaultConfig: RedspotConfig = {
  defaultNetwork: REDSPOT_DEFAULT_NETWORK_NAME,
  networks: {
    [REDSPOT_DEFAULT_NETWORK_NAME]: DEFAULT_REDSPOT_NETWORK_CONFIG,
  },
  analytics: {
    enabled: true,
  },
  mocha: {
    timeout: 20000,
  },
};

export default defaultConfig;
