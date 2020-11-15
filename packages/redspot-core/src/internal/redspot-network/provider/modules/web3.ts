import { keccak256 } from 'ethereumjs-util';

import { getPackageJson } from '../../../util/packageInfo';
import { MethodNotFoundError } from '../errors';
import { rpcData, validateParams } from '../input';
import { bufferToRpcData } from '../output';

// tslint:disable only-redspot-error

export class Web3Module {
  public async processRequest(
    method: string,
    params: any[] = []
  ): Promise<any> {
    switch (method) {
      case 'web3_clientVersion':
        return this._clientVersionAction(...this._clientVersionParams(params));

      case 'web3_sha3':
        return this._sha3Action(...this._sha3Params(params));
    }

    throw new MethodNotFoundError(`Method ${method} not found`);
  }

  // web3_clientVersion

  private _clientVersionParams(params: any[]): [] {
    return validateParams(params);
  }

  private async _clientVersionAction(): Promise<string> {
    const redspotPackage = await getPackageJson();
    const ethereumjsVMPackage = require('@nomiclabs/ethereumjs-vm/package.json');
    return `RedspotNetwork/${redspotPackage.version}/ethereumjs-vm/${ethereumjsVMPackage.version}`;
  }

  // web3_sha3

  private _sha3Params(params: any[]): [Buffer] {
    return validateParams(params, rpcData);
  }

  private async _sha3Action(buffer: Buffer): Promise<string> {
    return bufferToRpcData(keccak256(buffer));
  }
}
