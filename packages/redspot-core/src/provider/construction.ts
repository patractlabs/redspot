import { RedspotNetworkUserConfig } from '../types';
import { RpcProvider } from './rpc-provider';

export function createProvider(
  networkName: string,
  networkConfig: RedspotNetworkUserConfig
) {
  return new RpcProvider(
    networkName,
    networkConfig.endpoint,
    networkConfig.types,
    networkConfig.httpHeaders,
    networkConfig.accounts,
    networkConfig.gasLimit,
    {
      explorerUrl: networkConfig.explorerUrl
    }
  );
}
