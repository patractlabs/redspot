import type { KeyringPair } from '@polkadot/keyring/types';
import { bnToBn } from '@polkadot/util';
import { lazyObject } from '../internal/util/lazy';
import {
  ApiPromise as IApiPromise,
  Network,
  NetworkConfig,
  RedspotNetworkUserConfig
} from '../types';
import { Signer as AccountSigner } from './account-signer';
import { ApiPromise } from './api-promise';
import { Signer } from './signer';
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

  // @TODO proxy and private field https://github.com/tc39/proposal-class-fields/issues/106
  // const api = lazyObject(() => {
  //   return createApi(provider, networkConfig, signer);
  // });
  const api = createApi(provider, networkConfig, signer);

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
    keyring: signer.keyring,
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
