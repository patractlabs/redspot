import { SubmittableResult } from '@polkadot/api';
import type { SignerOptions } from '@polkadot/api/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import type { Registry } from '@polkadot/types/types';
import type { AccountSigner } from 'redspot/types';
import type { TransactionResponse } from './types';

export async function buildTx(
  registry: Registry,
  extrinsic: SubmittableExtrinsic<'promise'>,
  options: Partial<SignerOptions> & {
    signer: AccountSigner;
  }
): Promise<TransactionResponse> {
  const signerAddress = await options.signer.getAddress();

  return new Promise((resolve, reject) => {
    const actionStatus = {
      from: signerAddress.toString(),
      txHash: extrinsic.hash.toHex()
    } as Partial<TransactionResponse>;

    extrinsic
      .signAndSend(
        signerAddress,
        {
          ...options
        },
        (result: SubmittableResult) => {
          if (result.status.isInBlock) {
            actionStatus.blockHash = result.status.asInBlock.toHex();
          }

          if (result.status.isFinalized || result.status.isInBlock) {
            result.events
              .filter(
                ({ event: { section } }: any): boolean => section === 'system'
              )
              .forEach((event: any): void => {
                const {
                  event: { data, method }
                } = event;

                if (method === 'ExtrinsicFailed') {
                  const [dispatchError] = data;
                  let message = dispatchError.type;

                  if (dispatchError.isModule) {
                    try {
                      const mod = dispatchError.asModule;
                      const error = registry.findMetaError(
                        new Uint8Array([
                          mod.index.toNumber(),
                          mod.error.toNumber()
                        ])
                      );
                      message = `${error.section}.${error.name}`;
                    } catch (error) {
                      // swallow
                    }
                  }

                  actionStatus.error = {
                    message
                  };

                  reject(actionStatus);
                } else if (method === 'ExtrinsicSuccess') {
                  actionStatus.result = result;
                  resolve(actionStatus as TransactionResponse);
                }
              });
          } else if (result.isError) {
            actionStatus.error = {
              data: result
            };
            actionStatus.events = null;

            reject(actionStatus);
          }
        }
      )
      .catch((error: any) => {
        actionStatus.error = {
          message: error.message
        };

        reject(actionStatus);
      });
  });
}
