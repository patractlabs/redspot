import { SignerResult } from '@polkadot/api/types';
import type { SignOptions } from '@polkadot/keyring/types';
import { SignerPayloadJSON } from '@polkadot/types/types';
import type { LocalKeyringPair, ApiPromise, Signer as ISigner } from '../types';
import { Signer as AccountSigner } from './account-signer';

/**
 * A wrapper for Keyringpair
 */
export class Signer implements ISigner {
  /**
   *
   * @param pair An instantiation of keyringpair
   * @param api ApiPromise
   */
  constructor(
    public pair: LocalKeyringPair,
    public readonly accountSigner: AccountSigner
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
    return this.accountSigner.signPayload(payload);
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

  public setKeyPair(pair: LocalKeyringPair) {
    this.pair = pair;
  }
}
