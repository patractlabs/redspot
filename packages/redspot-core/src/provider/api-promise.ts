import { ApiPromise as PolkadotApiPromise } from '@polkadot/api';
import { ApiPromise as IApiPromise } from '../types';

export class ApiPromise extends PolkadotApiPromise implements IApiPromise {
  get isReady(): Promise<ApiPromise> {
    return this.connect().then(() => {
      return super.isReady;
    });
  }

  async connect(): Promise<void> {
    const isConnected = this.isConnected;

    if (!isConnected) {
      await super.connect();
    }
  }
}
