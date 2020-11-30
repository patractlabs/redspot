import { SubmittableResult } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type { AbiEvent } from '@polkadot/api-contract/types';
import type { SignerOptions, SubmittableExtrinsic } from '@polkadot/api/types';
import type { u64 } from '@polkadot/types/primitive';
import type {
  AnyJson,
  CodecArg,
  ISubmittableResult
} from '@polkadot/types/types';
import { Codec } from '@polkadot/types/types';
import BN from 'bn.js';
import type { AccountSigner } from 'redspot/types';

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

export type BigNumber = BN | number | string | BigInt;

export interface CallOverrides extends SignerOptions {
  dest?: any;
  value?: BigNumber;
  gasLimit?: BigNumber;
  signer: AccountSigner;
}

export interface CallParams {
  dest: any;
  value: BigNumber;
  gasLimit: BigNumber;
  inputData: Uint8Array;
}

export type TransactionParams = (CodecArg | Partial<CallOverrides>)[];
export type ContractFunction<T = any> = (
  ...args: TransactionParams
) => Promise<T>;

export type ContractAbi = AnyJson | Abi;

export interface PopulatedTransaction extends Partial<SignerOptions> {
  signer: AccountSigner;
  callParams?: CallParams;
  extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>;
}
