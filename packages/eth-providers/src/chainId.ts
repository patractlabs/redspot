import { IEthereumProvider } from "@redspot/buidler/types";
import { BuidlerError } from "@redspot/buidler/internal/core/errors";
import { ERRORS } from "@redspot/buidler/internal/core/errors-list";

import { createChainIdGetter, rpcQuantityToNumber } from "./provider-utils";
import { wrapSend } from "./wrapper";

export function createChainIdValidationProvider(
  provider: IEthereumProvider,
  chainId?: number
) {
  const getChainId = createChainIdGetter(provider);

  return wrapSend(provider, async (method: string, params: any[]) => {
    const realChainId = await getChainId();

    if (chainId !== undefined && realChainId !== chainId) {
      throw new BuidlerError(ERRORS.NETWORK.INVALID_GLOBAL_CHAIN_ID, {
        configChainId: chainId,
        connectionChainId: realChainId,
      });
    }

    return provider.send(method, params);
  });
}
