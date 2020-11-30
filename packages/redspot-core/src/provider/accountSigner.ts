import { SignerResult } from '@polkadot/api/types';
import type { SignOptions } from '@polkadot/keyring/types';
import { KeyringPair } from '@polkadot/keyring/types';
import type { Registry } from '@polkadot/types/types';
import { SignerPayloadJSON } from '@polkadot/types/types';
import type { AccountSigner as IAccountSigner } from '../types';

let id = 0;

/**
 * A wrapper for Keyringpair
 */
export default class AccountSigner implements IAccountSigner {
  /**
   *
   * @param registry Registry in Polkadot.js
   * @param pair An instantiation of keyringpair
   */
  constructor(
    public readonly registry: Registry,
    public readonly pair: KeyringPair
  ) {}

  /**
   * @description The Account address
   */
  get address() {
    return this.pair.address;
  }

  /**
   * @description The Account address
   */
  get addressRaw() {
    return this.pair.addressRaw;
  }

  /**
   * @description Public key of account
   */
  get publicKey() {
    return this.pair.publicKey;
  }

  /**
   * @description Public key of account
   */
  public sign(data: Uint8Array, options?: SignOptions): Uint8Array {
    return this.pair.sign(data, options);
  }

  /**
   * Returns the signature of the transaction
   *
   * @param payload - The data to be signed
   * @returns The signature of the transaction
   *
   */
  public async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve): void => {
      const signed = this.registry
        .createType('ExtrinsicPayload', payload, { version: payload.version })
        .sign(this.pair);

      resolve({ id: ++id, ...signed });
    });
  }

  /**
   * Get account address asynchronously
   *
   * @returns Account address
   *
   */
  public async getAddress(): Promise<string> {
    return Promise.resolve(this.pair.address);
  }

  public setKeyPair() {}
}
