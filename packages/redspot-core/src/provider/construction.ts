import { ApiPromise } from './api-promise';
import { Keyring } from '@polkadot/keyring';
import type { KeyringPair } from '@polkadot/keyring/types';
import { bnToBn } from '@polkadot/util';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import { lazyObject } from '../internal/util/lazy';
import {
  ApiPromise as IApiPromise,
  Network,
  NetworkConfig,
  RedspotNetworkUserConfig
} from '../types';
import { Signer } from './signer';
import { WsProvider } from './ws-provider';

export function createProvider(networkConfig: RedspotNetworkUserConfig) {
  return new WsProvider(networkConfig.endpoint, networkConfig.httpHeaders);
}

export function createApi(
  provider: WsProvider,
  config: NetworkConfig
): IApiPromise {
  const api = new ApiPromise({
    provider,
    types: config.types,
    typesAlias: config.typesAlias,
    typesBundle: config.typesBundle,
    typesChain: config.typesChain,
    typesSpec: config.typesSpec,
    rpc: config.rpc
  });

  return api;
}

export async function getSigners(api: ApiPromise) {
  return this.accounts.map((account: any) => {
    let pair: KeyringPair;
    if (typeof account === 'object') {
      try {
        pair = this.keyring.addPair(account);

        pair.lock = (): void => {};
      } catch (error) {
        console.log(error.message);
        throw new RedspotError(ERRORS.GENERAL.BAD_KEYPAIR);
      }
    } else {
      try {
        const meta = {
          name: account.replace('//', '_').toLowerCase()
        };

        pair = this.keyring.addFromUri(account, meta);

        pair.lock = (): void => {};
      } catch (error) {
        console.log(error.message);
        throw new RedspotError(ERRORS.GENERAL.BAD_SURI, { uri: account });
      }
    }

    return new Signer(pair, api);
  });
}

export function createSigner(api: ApiPromise, pair: KeyringPair) {
  return new Signer(pair, api);
}

export function createNetwork(
  networkName: string,
  networkConfig: NetworkConfig
): Network {
  const provider = lazyObject(() => {
    return createProvider(networkConfig);
  });

  const api = lazyObject(() => {
    return createApi(provider, networkConfig);
  });

  const registry = api.registry;
  const gasLimit =
    networkConfig.gasLimit !== undefined
      ? bnToBn(networkConfig.gasLimit)
      : undefined;

  const explorerUrl = networkConfig.explorerUrl;

  const keyring = new Keyring({
    type: 'sr25519'
  });

  return {
    name: networkName,
    config: networkConfig,
    provider,
    api,
    registry,
    keyring,
    getSigners: async () => {
      const defaultAccounts = [
        '//Alice',
        '//Bob',
        '//Charlie',
        '//Dave',
        '//Eve',
        '//Ferdie'
      ];

      await api.isReady;

      return (networkConfig.accounts || defaultAccounts).map((account: any) => {
        let pair: KeyringPair;
        if (typeof account === 'object') {
          try {
            pair = keyring.addPair(account);

            pair.lock = (): void => {};
          } catch (error) {
            console.log(error.message);
            throw new RedspotError(ERRORS.GENERAL.BAD_KEYPAIR);
          }
        } else {
          try {
            const meta = {
              name: account.replace('//', '_').toLowerCase()
            };

            pair = keyring.addFromUri(account, meta);

            pair.lock = (): void => {};
          } catch (error) {
            console.log(error.message);
            throw new RedspotError(ERRORS.GENERAL.BAD_SURI, { uri: account });
          }
        }

        return new Signer(pair, api);
      });
    },
    createSigner: createSigner.bind(null, api),
    gasLimit,
    explorerUrl
  };
}
