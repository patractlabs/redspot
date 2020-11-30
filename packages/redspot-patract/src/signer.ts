import { ApiPromise } from '@polkadot/api';
import { bnToBn } from '@polkadot/util';
import BN from 'bn.js';
import AccountSigner from 'redspot/provider/accountSigner';

/**
 * Extends Account Signer, adding gaslimit and api attributes
 */
export class Signer extends AccountSigner {
  public gasLimit?: BN;
  public api?: ApiPromise;

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
}
