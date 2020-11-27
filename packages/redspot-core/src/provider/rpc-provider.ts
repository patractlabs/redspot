import { Keyring } from '@polkadot/keyring';
import type { KeyringPair } from '@polkadot/keyring/types';
import { TypeRegistry } from '@polkadot/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import BN from 'bn.js';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import type { RpcProvider as IRpcProvider } from '../types';
import { RedspotNetworkAccountsUserConfig } from '../types';
import AccountSigner from './accountSigner';
import WsProvider from './ws-provider';

export class RpcProvider extends WsProvider implements IRpcProvider {
  readonly accounts: RedspotNetworkAccountsUserConfig;
  readonly keyring: Keyring;
  readonly gasLimit?: BN;
  readonly networkName: string;
  readonly registry: TypeRegistry;
  readonly extra?: {
    explorerUrl?: string;
  };

  constructor(
    networkName: string,
    endpoint: string | string[] = 'ws://127.0.0.1:9944',
    types: Record<string, any> = {},
    httpHeaders: Record<string, string>,
    accounts: RedspotNetworkAccountsUserConfig = [
      '//Alice',
      '//Bob',
      '//Charlie',
      '//Dave',
      '//Eve',
      '//Ferdie'
    ],
    gasLimit?: BN | number | string,
    extra?: {
      explorerUrl?: string;
    }
  ) {
    super(endpoint, httpHeaders);
    this.networkName = networkName;
    this.gasLimit = gasLimit && new BN(gasLimit);
    this.extra = extra;
    this.registry = new TypeRegistry();

    this.registry.setKnownTypes({
      types: { ...types }
    });

    this.keyring = new Keyring({
      type: 'sr25519'
    });

    this.accounts = accounts;
  }

  async getKeyringPairs(): Promise<KeyringPair[]> {
    await cryptoWaitReady();

    return this.accounts.map((account) => {
      if (typeof account === 'object') {
        try {
          const pair = this.keyring.addPair(account);

          pair.lock = (): void => {};

          return pair;
        } catch (error) {
          console.log(error.message);
          throw new RedspotError(ERRORS.GENERAL.BAD_KEYPAIR);
        }
      } else {
        try {
          const meta = {
            name: account.replace('//', '_').toLowerCase()
          };

          const pair = this.keyring.addFromUri(account, meta);

          pair.lock = (): void => {};

          return pair;
        } catch (error) {
          console.log(error.message);
          throw new RedspotError(ERRORS.GENERAL.BAD_SURI, { uri: account });
        }
      }
    });
  }

  createSigner(keyringPair: KeyringPair): AccountSigner {
    return new AccountSigner(this.registry, keyringPair, {
      gasLimit: this.gasLimit
    });
  }
}
