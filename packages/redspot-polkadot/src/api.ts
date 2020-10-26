import { ApiPromise, SubmittableResult } from "@polkadot/api";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { ApiOptions, SubmittableExtrinsic } from "@polkadot/api/types";
import Keyring from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, EventRecord } from "@polkadot/types/interfaces";
import { KeypairType } from "@polkadot/util-crypto/types";
import { readAbiSync } from "redspot/plugins";
import { Artifact, Network, ProjectPaths } from "redspot/types";
import ContractFactory from "./contract-factory";

interface TxStatus {
  account: string;
  txHash?: string;
  blockHash?: string;
  message?: string;
  data?: any;
  status: "error" | "event" | "queued" | "success";
  result: SubmittableResult;
  events?: {
    bytes: string;
    section: string;
    method: string;
    phaseType: string;
    phaseIndex: number;
    args: any[];
  }[];
}

export default class Api extends ApiPromise {
  public readonly paths: ProjectPaths;
  public readonly network: Network;
  public readonly keyring: Keyring;
  public readonly contract: ContractFactory;

  constructor(apiOptions: ApiOptions, network: Network, paths: ProjectPaths) {
    super(apiOptions);
    this.network = network;
    this.paths = paths;
    this.keyring = new Keyring({
      ss58Format: this.registry.chainSS58,
    });
    this.contract = new ContractFactory(this);
  }

  async getPairs(type: KeypairType = "sr25519"): Promise<KeyringPair[]> {
    await this.isReady;

    this.keyring.setSS58Format(this.registry.chainSS58);

    const options = {
      ss58Format: this.registry.chainSS58,
    };

    const accounts = this.network.provider.accounts;

    return accounts;
  }

  getContract(nameOrAbi: string | Artifact | Abi, address: string | AccountId) {
    const abi =
      typeof nameOrAbi === "string"
        ? readAbiSync(this.paths.artifacts, nameOrAbi)
        : nameOrAbi;

    return new ContractPromise(this, abi as any, address);
  }

  getAbi(nameOrAbi: string | Artifact) {
    const abi =
      typeof nameOrAbi === "string"
        ? readAbiSync(this.paths.artifacts, nameOrAbi)
        : nameOrAbi;

    return new Abi(this.registry as any, abi as any);
  }

  formatEvents(records: EventRecord[]) {
    return records.map((record) => {
      const documentation = (record.event.meta.toJSON() as any)?.documentation?.join(
        "\n"
      );

      return {
        doc: documentation,
        bytes: record.toHex(),
        section: record.event.section,
        method: record.event.method,
        phaseType: record.phase.type,
        phaseIndex: record.phase.isNone
          ? null
          : (record.phase.value as any).toNumber(),
        args: record.event.data.toJSON() as any[],
      };
    });
  }

  extrinsicHelper(
    extrinsic: SubmittableExtrinsic<"promise">,
    signer: KeyringPair
  ): Promise<TxStatus> {
    return new Promise((resolve, reject) => {
      const actionStatus = {
        txHash: extrinsic.hash.toHex(),
        data: extrinsic.toHex(),
      } as Partial<TxStatus>;

      extrinsic
        .signAndSend(signer, (result: SubmittableResult) => {
          actionStatus.result = result;

          if (result.status.isInBlock) {
            actionStatus.blockHash = result.status.asInBlock.toHex();
          }

          if (result.status.isFinalized || result.status.isInBlock) {
            actionStatus.account = extrinsic.signer.toString();
            actionStatus.events = this.formatEvents(result.events);

            result.events
              .filter(
                ({ event: { section } }: any): boolean => section === "system"
              )
              .forEach((event: any): void => {
                const {
                  event: { data, method },
                } = event;

                if (method === "ExtrinsicFailed") {
                  const [dispatchError] = data;
                  let message = dispatchError.type;

                  if (dispatchError.isModule) {
                    try {
                      const mod = dispatchError.asModule;
                      const error = this.registry.findMetaError(
                        new Uint8Array([
                          mod.index.toNumber(),
                          mod.error.toNumber(),
                        ])
                      );
                      message = `${error.section}.${error.name}`;
                    } catch (error) {
                      // swallow
                    }
                  }

                  actionStatus.message = message;
                  actionStatus.status = "error";
                  reject(actionStatus);
                } else if (method === "ExtrinsicSuccess") {
                  actionStatus.status = "success";
                  resolve(actionStatus as TxStatus);
                }
              });
          } else if (result.isError) {
            actionStatus.account = extrinsic.signer.toString();
            actionStatus.status = "error";
            actionStatus.data = result;
            actionStatus.events = this.formatEvents(result.events);

            reject(actionStatus);
          }
        })
        .catch((error: any) => {
          actionStatus.message = error.message;
          actionStatus.data = error;
          actionStatus.status = "error";
          actionStatus.account = extrinsic.signer.toString();

          reject(actionStatus);
        });
    });
  }
}
