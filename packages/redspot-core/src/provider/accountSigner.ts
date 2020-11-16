import { SignerResult } from '@polkadot/api/types';
import type { SignOptions } from '@polkadot/keyring/types';
import { KeyringPair } from '@polkadot/keyring/types';
import type { Registry } from '@polkadot/types/types';
import { SignerPayloadJSON } from '@polkadot/types/types';
import BN from 'bn.js';
import type { AccountSigner as IAccountSigner } from '../types';

let id = 0;

export default class AccountSigner implements IAccountSigner {
  readonly pair: KeyringPair;
  readonly gasLimit: BN;
  readonly registry: Registry;
  readonly sign: (data: Uint8Array, options?: SignOptions) => Uint8Array;

  constructor(
    registry: Registry,
    keyringPair: KeyringPair,
    defaults: {
      gasLimit: BN;
    }
  ) {
    this.registry = registry;
    this.pair = keyringPair;
    this.gasLimit = defaults.gasLimit;
    this.sign = keyringPair.sign;
  }

  get address() {
    return this.pair.address;
  }

  get addressRaw() {
    return this.pair.addressRaw;
  }

  get publicKey() {
    return this.pair.publicKey;
  }

  public async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve): void => {
      const signed = this.registry
        .createType('ExtrinsicPayload', payload, { version: payload.version })
        .sign(this.pair);

      resolve({ id: ++id, ...signed });
    });
  }

  public async getAddress(): Promise<string> {
    return Promise.resolve(this.pair.address);
  }

  public setKeyPair() {}

  public setGasLimit(gasLimit: BN | string | bigint): void {
    Object.defineProperty(this, 'gasLimit', {
      enumerable: true,
      value: gasLimit,
      writable: false
    });
  }
}
