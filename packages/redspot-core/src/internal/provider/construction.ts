import { NetworkConfig } from "../../types";
import { NetworkProvider } from "./network-provider";

export function createProvider(
  networkName: string,
  networkConfig: NetworkConfig
) {
  return new NetworkProvider(
    networkName,
    networkConfig.endpoint,
    networkConfig.types,
    networkConfig.httpHeaders,
    networkConfig.accounts,
    networkConfig.endowment,
    networkConfig.gasLimit
  );
}
