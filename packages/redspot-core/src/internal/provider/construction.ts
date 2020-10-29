import { NetworkConfig } from "../../types";
import { RpcProvider } from "./rpc-provider";

export function createProvider(
  networkName: string,
  networkConfig: NetworkConfig
) {
  return new RpcProvider(
    networkName,
    networkConfig.endpoint,
    networkConfig.types,
    networkConfig.httpHeaders,
    networkConfig.accounts,
    networkConfig.gasLimit
  );
}
