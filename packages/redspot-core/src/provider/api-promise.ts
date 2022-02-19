import { ApiPromise as PolkadotApiPromise } from '@polkadot/api';
import { ApiPromise as IApiPromise } from '../types';
import { Signer as AccountSigner } from './account-signer';
import '@polkadot/api-augment/polkadot';
export class ApiPromise extends PolkadotApiPromise implements IApiPromise {
  get isReady(): Promise<ApiPromise> {
    return this.connect()
      .then(() => {
        return super.isReady;
      })
      .then((api) => {
        const signer = this._rx.signer as AccountSigner;

        signer.keyring && signer.keyring.setSS58Format(api.registry.chainSS58);
        signer.setUp && signer.setUp();

        return api;
      });
  }

  get isReadyOrError(): Promise<ApiPromise> {
    return this.connect()
      .then(() => {
        return super.isReadyOrError;
      })
      .then((api) => {
        const signer = this._rx.signer as AccountSigner;

        signer.keyring && signer.keyring.setSS58Format(api.registry.chainSS58);
        signer.setUp && signer.setUp();

        return api;
      });
  }

  async connect(): Promise<void> {
    const isConnected = this.isConnected;

    if (!isConnected) {
      await super.connect();
    }
  }
}
