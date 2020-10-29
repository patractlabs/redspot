import { SubmittableResult } from "@polkadot/api";
import type { SignerOptions } from "@polkadot/api/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import type { EventRecord } from "@polkadot/types/interfaces";
import type { Registry } from "@polkadot/types/types";
import type { AccountSigner } from "redspot/types";

export interface TransactionResponse {
  from: string;
  txHash?: string;
  blockHash?: string;
  error?: {
    message?: any;
    data?: any;
  };
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

export async function buildTx(
  registry: Registry,
  extrinsic: SubmittableExtrinsic<"promise">,
  options: Partial<SignerOptions> & {
    signer: AccountSigner;
  }
): Promise<TransactionResponse> {
  const signerAddress = await options.signer.getAddress();

  return new Promise((resolve, reject) => {
    const actionStatus = {
      from: signerAddress.toString(),
      txHash: extrinsic.hash.toHex(),
    } as Partial<TransactionResponse>;

    extrinsic
      .signAndSend(
        signerAddress,
        {
          ...options,
        },
        (result: SubmittableResult) => {
          if (result.status.isInBlock) {
            actionStatus.blockHash = result.status.asInBlock.toHex();
          }

          if (result.status.isFinalized || result.status.isInBlock) {
            actionStatus.events = formatEvents(result.events);

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
                      const error = registry.findMetaError(
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

                  actionStatus.error = {
                    message,
                  };

                  reject(actionStatus);
                } else if (method === "ExtrinsicSuccess") {
                  actionStatus.result = result;
                  resolve(actionStatus as TransactionResponse);
                }
              });
          } else if (result.isError) {
            actionStatus.error = {
              data: result,
            };
            actionStatus.events = formatEvents(result.events);

            reject(actionStatus);
          }
        }
      )
      .catch((error: any) => {
        actionStatus.error = {
          message: error.message,
        };

        reject(actionStatus);
      });
  });
}

export function formatEvents(records: EventRecord[]) {
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
