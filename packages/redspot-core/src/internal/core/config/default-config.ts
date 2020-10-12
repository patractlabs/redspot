import { BuidlerConfig, NetworkConfig } from "../../../types";
import { BUIDLEREVM_NETWORK_NAME } from "../../constants";

const DEFAULT_BUIDLER_NETWORK_CONFIG: NetworkConfig = {
  gasLimit: "50000000000",
  endowment: "5000000000000",
  accounts: ["//Alice", "//Bob", "//Charlie", "//Dave", "//Eve", "//Ferdie"],
  endpoint: ["ws://127.0.0.1:9944"],
  types: {},
  autoConnectMs: false,
  httpHeaders: {},
};

const defaultConfig: BuidlerConfig = {
  defaultNetwork: BUIDLEREVM_NETWORK_NAME,
  networks: {
    [BUIDLEREVM_NETWORK_NAME]: DEFAULT_BUIDLER_NETWORK_CONFIG,
  },
  analytics: {
    enabled: true,
  },
  mocha: {
    timeout: 20000,
  },
};

export default defaultConfig;
