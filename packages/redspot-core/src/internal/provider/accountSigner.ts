import { SignerResult } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { SignerPayloadJSON } from "@polkadot/types/types";
import registry from "../provider/registry";
import { IAccountSigner } from "../../types";
import BN from "bn.js";

let id = 0;

export default class AccountSigner implements IAccountSigner {
  readonly pair: KeyringPair;
  readonly gasLimit: BN;
  readonly endowment: BN;

  constructor(
    keyringPair: KeyringPair,
    defaults: {
      endowment: BN;
      gasLimit: BN;
    }
  ) {
    this.pair = keyringPair;
    this.endowment = defaults.endowment;
    this.gasLimit = defaults.gasLimit;
  }

  public async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve): void => {
      const signed = registry
        .createType("ExtrinsicPayload", payload, { version: payload.version })
        .sign(this.pair);

      resolve({ id: ++id, ...signed });
    });
  }

  public async getAddress(): Promise<string> {
    return Promise.resolve(this.pair.address);
  }

  public setKeyPair() {}

  public setEndowment(endowment: BN | string): void {
    Object.defineProperty(this, "endowment", {
      enumerable: true,
      value: endowment,
      writable: false,
    });
  }

  public setGasLimit(gasLimit: BN | string): void {
    Object.defineProperty(this, "gasLimit", {
      enumerable: true,
      value: gasLimit,
      writable: false,
    });
  }
}
