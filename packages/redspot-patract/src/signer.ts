import { ApiPromise } from '@polkadot/api';
import BN from 'bn.js';
import AccountSigner from 'redspot/provider/accountSigner';

/**
 * Extends Account Signer, adding gaslimit and api attributes
 */
export class Signer extends AccountSigner {
  public readonly gasLimit?: BN;
  public readonly api?: ApiPromise;

  /**
   * Set the default gaslimit.
   *
   * @param gasLimit the default gaslimit
   */
  public setGasLimit(gasLimit: BN | string | bigint): void {
    Object.defineProperty(this, 'gasLimit', {
      enumerable: true,
      value: gasLimit,
      writable: false
    });
  }

  /**
   * Set the api, It should be an instance of an api promise
   *
   * @param api the api
   */
  public setApi(api: ApiPromise): void {
    Object.defineProperty(this, 'gasLimit', {
      enumerable: true,
      value: api,
      writable: false
    });
  }
}
