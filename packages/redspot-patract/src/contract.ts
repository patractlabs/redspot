import { ApiPromise } from "@polkadot/api";
import { Abi } from "@polkadot/api-contract";
import type {
  AbiMessage,
  ContractCallOutcome,
} from "@polkadot/api-contract/types";
import type { SignerOptions, SubmittableExtrinsic } from "@polkadot/api/types";
import { createTypeUnsafe, Raw } from "@polkadot/types";
import type { AccountId, ContractExecResult } from "@polkadot/types/interfaces";
import type {
  AnyJson,
  CodecArg,
  ISubmittableResult,
} from "@polkadot/types/types";
import { Codec, Registry, TypeDef } from "@polkadot/types/types";
import BN from "bn.js";
import type { AccountSigner } from "redspot/types";
import { buildTx, TransactionResponse } from "./buildTx";

export function formatData(
  registry: Registry,
  data: Raw,
  { type }: TypeDef
): Codec {
  return createTypeUnsafe(registry, type, [data], true);
}

export type TransactionParams = (CodecArg | CallOverrides)[];
export type ContractFunction<T = any> = (
  ...args: TransactionParams
) => Promise<T>;

export type ContractAbi = AnyJson | Abi;

export interface PopulatedTransaction extends Partial<SignerOptions> {
  signer: AccountSigner;
  callParams?: CallParams;
  extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>;
}

export interface CallOverrides extends SignerOptions {
  dest?: any;
  value?: any;
  gasLimit?: BN | string;
  txParams?: any;
  signer: AccountSigner;
}

export interface CallParams {
  dest: any;
  value: any;
  gasLimit: string | BN;
  inputData: Uint8Array;
}

async function populateTransaction(
  contract: Contract,
  fragment: AbiMessage,
  args: TransactionParams
): Promise<PopulatedTransaction> {
  let overrides: Partial<CallOverrides> = {};

  if (
    args.length === fragment.args.length + 1 &&
    typeof args[args.length - 1] === "object"
  ) {
    overrides = { ...(args.pop() as CallOverrides) };
  }

  // The ABI coded transaction
  const data = fragment.toU8a(args as CodecArg[]);

  const singerAddress = await contract.signer.getAddress();

  const callParams: CallParams = {
    dest: overrides.dest || singerAddress,
    value: overrides.value || new BN("0"),
    gasLimit:
      overrides.gasLimit ||
      contract.signer.gasLimit ||
      contract.api.consts.system.maximumBlockWeight.muln(64).divn(100),
    inputData: data,
  };

  const signer = overrides.signer || contract.signer;

  // Remvoe the overrides
  delete overrides.dest;
  delete overrides.value;
  delete overrides.gasLimit;
  delete overrides.signer;

  return {
    ...overrides,
    signer,
    callParams,
    extrinsic: contract.api.tx.contracts.call(
      callParams.dest,
      callParams.value,
      callParams.gasLimit,
      callParams.inputData
    ),
  };
}

function buildPopulate(
  contract: Contract,
  fragment: AbiMessage
): ContractFunction<PopulatedTransaction> {
  return function (...args: TransactionParams): Promise<PopulatedTransaction> {
    return populateTransaction(contract, fragment, args);
  };
}

function buildCall(
  contract: Contract,
  fragment: AbiMessage
): ContractFunction<ContractCallOutcome> {
  return async function (
    ...args: TransactionParams
  ): Promise<ContractCallOutcome> {
    const { extrinsic, callParams, ...options } = await populateTransaction(
      contract,
      fragment,
      args
    );

    const origin = await options.signer.getAddress();

    const result: ContractExecResult = await contract.api.rpc.contracts.call({
      ...callParams,
      origin,
    });

    const outcome: ContractCallOutcome = {
      output:
        result.isSuccess && fragment.returnType
          ? createTypeUnsafe(
              contract.api.registry,
              fragment.returnType.type,
              [result.asSuccess.data],
              true
            )
          : null,
      result,
    };

    return outcome;
  };
}

function buildDefault(
  contract: Contract,
  fragment: AbiMessage
): ContractFunction {
  if (!fragment.isMutating) {
    return buildCall(contract, fragment);
  }
  return buildSend(contract, fragment);
}

function buildSend(
  contract: Contract,
  fragment: AbiMessage
): ContractFunction<TransactionResponse> {
  return async function (
    ...args: TransactionParams
  ): Promise<TransactionResponse> {
    const { extrinsic, callParams, ...options } = await populateTransaction(
      contract,
      fragment,
      args
    );

    const tx = await buildTx(contract.api.registry, extrinsic, {
      ...options,
    });

    return tx;
  };
}

function buildEstimate(
  contract: Contract,
  fragment: AbiMessage
): ContractFunction<BN> {
  return async function (...args: TransactionParams): Promise<BN> {
    const call = buildCall(contract, fragment);
    const callResult = await call(...args);
    if (!callResult.result.isSuccess) {
      return new BN("0");
    } else {
      return new BN(callResult.result.asSuccess.gasConsumed);
    }
  };
}

export default class Contract {
  public readonly address: AccountId;
  public readonly abi: Abi;
  public readonly signer: AccountSigner;
  public readonly api: ApiPromise;
  public readonly functions: { [name: string]: ContractFunction };
  public readonly callStatic: { [name: string]: ContractFunction };
  public readonly estimateGas: { [name: string]: ContractFunction<BN> };

  public readonly populateTransaction: {
    [name: string]: ContractFunction<PopulatedTransaction>;
  };

  // The meta-class properties
  readonly [key: string]: ContractFunction | any;

  constructor(
    address: string | AccountId,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: AccountSigner
  ) {
    this.address = apiProvider.registry.createType("AccountId", address);

    this.abi =
      contractAbi instanceof Abi
        ? contractAbi
        : new Abi(contractAbi, apiProvider.registry.getChainProperties());

    this.api = apiProvider;
    this.signer = signer;
    this.api.tx.contracts.call;
    this.callStatic = {};
    this.estimateGas = {};
    this.functions = {};
    this.callStatic = {};

    this.populateTransaction = {};
    this.address = this.api.registry.createType("AccountId", address);

    for (const fragment of this.abi.messages) {
      const identifier = fragment.identifier;

      if (this[identifier] == null) {
        Object.defineProperty(this, identifier, {
          enumerable: true,
          value: buildDefault(this, fragment),
          writable: false,
        });
      }

      if (this.callStatic[identifier] == null) {
        this.callStatic[identifier] = buildCall(this, fragment);
      }

      if (this.populateTransaction[identifier] == null) {
        this.callStatic[identifier] = buildPopulate(this, fragment);
      }

      if (this.estimateGas[identifier] == null) {
        this.callStatic[identifier] = buildEstimate(this, fragment);
      }
    }
  }

  connect(signer: AccountSigner): Contract {
    const contract = new (<{ new (...args: any[]): Contract }>this.constructor)(
      this.address,
      this.abi,
      this.api,
      signer
    );

    return contract;
  }

  attach(address: string): Contract {
    return new (<{ new (...args: any[]): Contract }>this.constructor)(
      address,
      this.abi,
      this.api,
      this.signer
    );
  }
}
