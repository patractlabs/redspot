import { Signer, SignerResult } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { SignerPayloadJSON } from "@polkadot/types/types";
import registry from "../provider/registry";

let id = 0;

export default class AccountSigner implements Signer {
  readonly address: string;
  readonly publicKey: Uint8Array;

  readonly #keyringPair: KeyringPair;

  constructor(keyringPair: KeyringPair) {
    this.#keyringPair = keyringPair;
  }

  public async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    return new Promise((resolve): void => {
      const signed = registry
        .createType("ExtrinsicPayload", payload, { version: payload.version })
        .sign(this.#keyringPair);

      resolve({ id: ++id, ...signed });
    });
  }

  public async getAddress(): Promise<string> {
    return Promise.resolve(this.#keyringPair.address);
  }
}
