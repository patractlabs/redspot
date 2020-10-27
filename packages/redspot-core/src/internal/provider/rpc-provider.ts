import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { TypeRegistry } from "@polkadot/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import BN from "bn.js";
import { IRpcProvider, NetworkConfigAccounts } from "../../types";
import WsProvider from "./ws-provider";
import { RedspotError } from "../core/errors";
import { ERRORS } from "../core/errors-list";
import AccountSigner from "./accountSigner";

export class RpcProvider extends WsProvider implements IRpcProvider {
  readonly accounts: NetworkConfigAccounts;
  readonly keyring: Keyring;
  readonly endowment: BN;
  readonly gasLimit: BN;
  readonly networkName: string;
  readonly registry: TypeRegistry;

  constructor(
    networkName: string,
    endpoint: string | string[] = "ws://127.0.0.1:9944",
    types: Record<string, any> = {},
    httpHeaders: Record<string, string>,
    accounts: NetworkConfigAccounts = [
      "//Alice",
      "//Bob",
      "//Charlie",
      "//Dave",
      "//Eve",
      "//Ferdie",
    ],
    endowment: BN | number | string = "5000000000000",
    gasLimit: BN | number | string = "50000000000"
  ) {
    super(endpoint, httpHeaders);
    this.networkName = networkName;
    this.endowment = new BN(endowment);
    this.gasLimit = new BN(gasLimit);
    this.registry = new TypeRegistry();

    this.registry.setKnownTypes({
      types: { ...types },
    });

    this.keyring = new Keyring({
      type: "sr25519",
    });

    this.accounts = accounts;
  }

  async getKeyringPairs(): Promise<KeyringPair[]> {
    await cryptoWaitReady();

    return this.accounts.map((account) => {
      if (typeof account === "object") {
        try {
          const pair = this.keyring.addPair(account);

          pair.lock = (): void => {};

          return pair;
        } catch (error) {
          console.log(error.message);
          throw new RedspotError(ERRORS.GENERAL.BAD_KEYPAIR);
        }
      } else {
        try {
          const meta = {
            name: account.replace("//", "_").toLowerCase(),
          };

          const pair = this.keyring.addFromUri(account, meta);

          pair.lock = (): void => {};

          return pair;
        } catch (error) {
          console.log(error.message);
          throw new RedspotError(ERRORS.GENERAL.BAD_SURI, { uri: account });
        }
      }
    });
  }

  createSigner(keyringPair: KeyringPair): AccountSigner {
    return new AccountSigner(this.registry, keyringPair, {
      endowment: this.endowment,
      gasLimit: this.gasLimit,
    });
  }
}
