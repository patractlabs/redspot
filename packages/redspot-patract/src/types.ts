import { SubmittableResult } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type { AbiEvent } from '@polkadot/api-contract/types';
import type { SignerOptions, SubmittableExtrinsic } from '@polkadot/api/types';
import type { AnyJson, ISubmittableResult } from '@polkadot/types/types';
import { Codec } from '@polkadot/types/types';
import BN from 'bn.js';

export interface DecodedEvent {
  args: Codec[];
  name: string;
  event: AbiEvent;
}

export interface TransactionResponse {
  from: string;
  txHash?: string;
  blockHash?: string;
  error?: {
    message?: any;
    data?: any;
  };
  result: SubmittableResult;
  events?: DecodedEvent[];
}

export type BigNumber = BN | number | string | bigint;

export interface CallOverrides extends SignerOptions {
  dest?: any;
  salt?: any;
  value?: BigNumber;
  gasLimit?: BigNumber;
  storageDepositLimit?: BigNumber;
  signer: never;
}

export interface CallParams {
  dest: any;
  value: BigNumber;
  gasLimit: BigNumber;
  inputData: Uint8Array;
}

export type TransactionParams = (unknown | Partial<CallOverrides>)[];
export type ContractFunction<T = any> = (
  ...args: TransactionParams
) => Promise<T>;

export type ContractAbi = Record<string, unknown> | Abi;

export interface PopulatedTransaction extends Partial<SignerOptions> {
  callParams?: CallParams;
  extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>;
}
