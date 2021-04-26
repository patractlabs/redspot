import type { KeyringPair } from '@polkadot/keyring/types';
import { bnToBn } from '@polkadot/util';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import { lazyObject } from '../internal/util/lazy';
import log from '../logger';
import type { LocalKeyringPair } from '../types';
import {
  ApiPromise as IApiPromise,
  Network,
  NetworkConfig,
  RedspotNetworkUserConfig
} from '../types';
import { ApiPromise, keyring } from './api-promise';
import { Signer } from './signer';
import { Signer as AccountSigner } from './account-signer';
import { encodeSalt } from './utils';
import { WsProvider } from './ws-provider';

export function createProvider(networkConfig: RedspotNetworkUserConfig) {
  return new WsProvider(networkConfig.endpoint, networkConfig.httpHeaders);
}

export function createApi(
  provider: WsProvider,
  config: NetworkConfig,
  signer?: AccountSigner
): IApiPromise {
  const api = new ApiPromise({
    provider,
    types: config.types,
    typesAlias: config.typesAlias,
    typesBundle: config.typesBundle,
    typesChain: config.typesChain,
    typesSpec: config.typesSpec,
    rpc: config.rpc,
    signer: signer
  });

  return api;
}

export function createSigner(signer: AccountSigner, pair: KeyringPair) {
  return new Signer(pair, signer);
}

export function addPair(signer: AccountSigner, pair: KeyringPair): KeyringPair {
  return signer.addPair(pair);
}

export function createNetwork(
  networkName: string,
  networkConfig: NetworkConfig
): Network {
  const provider = lazyObject(() => {
    return createProvider(networkConfig);
  });

  const signer = new AccountSigner();

  const api = lazyObject(() => {
    return createApi(provider, networkConfig, signer);
  });

  const registry = api.registry;

  signer.init(registry, networkConfig.accounts);

  const gasLimit =
    networkConfig.gasLimit !== undefined
      ? bnToBn(networkConfig.gasLimit)
      : undefined;

  return {
    name: networkName,
    config: networkConfig,
    provider,
    api,
    registry,
    keyring,
    signer,
    getSigners: async () => {
      await api.isReady;

      const pairs = signer.getPairs();

      return pairs.map((pair) => {
        return new Signer(pair, signer);
      });
    },
    getAddresses: async () => {
      await api.isReady;

      const pairs = signer.getPairs();

      return pairs.map((pair) => {
        return pair.address;
      });
    },
    createSigner: createSigner.bind(null, signer),
    addPair: addPair.bind(null, signer),
    gasLimit,
    utils: {
      encodeSalt
    }
  };
}
