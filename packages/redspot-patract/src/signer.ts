import { ApiPromise } from '@polkadot/api';
import { SignerResult } from '@polkadot/api/types';
import type { SignOptions } from '@polkadot/keyring/types';
import { KeyringPair } from '@polkadot/keyring/types';
import type { Registry } from '@polkadot/types/types';
import { SignerPayloadJSON } from '@polkadot/types/types';
import { bnToBn } from '@polkadot/util';
import BN from 'bn.js';

let id = 0;

/**
 * A wrapper for Keyringpair
 */
export class Signer {
  public gasLimit?: BN;
  public api?: ApiPromise;

  /**
   *
   * @param registry Registry in Polkadot.js
   * @param pair An instantiation of keyringpair
   */
  constructor(public readonly registry: Registry, public pair: KeyringPair) {}

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

  /**
   * Set the default gaslimit.
   *
   * @param gasLimit the default gaslimit
   */
  public setGasLimit(gasLimit: BN | number | string | BigInt): void {
    this.gasLimit = bnToBn(gasLimit);
  }

  /**
   * Set the api, It should be an instance of an api promise
   *
   * @param api the api
   */
  public setApi(api: ApiPromise): void {
    this.api = api;
  }

  /**
   *
   */
  public setKeyPair(pair: KeyringPair) {
    this.pair = pair;
  }
}
