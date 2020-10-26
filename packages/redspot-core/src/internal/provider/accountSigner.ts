import { SignerResult } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { SignerPayloadJSON } from "@polkadot/types/types";
import registry from "../provider/registry";
import { IAccountSigner } from "../../types";

let id = 0;

export default class AccountSigner implements IAccountSigner {
  readonly pair: KeyringPair;

  constructor(keyringPair: KeyringPair) {
    this.pair = keyringPair;
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
}
