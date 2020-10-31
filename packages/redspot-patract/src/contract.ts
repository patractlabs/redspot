import { ApiPromise } from "@polkadot/api";
import { Abi } from "@polkadot/api-contract";
import type {
  AbiMessage,
  ContractCallOutcome,
} from "@polkadot/api-contract/types";
import type { SignerOptions, SubmittableExtrinsic } from "@polkadot/api/types";
import { createTypeUnsafe, Raw } from "@polkadot/types";
import { u8aToHex, isU8a, stringCamelCase } from "@polkadot/util";
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
import log from "redspot/internal/log";
import chalk from "chalk";

export function formatData(
  registry: Registry,
  data: Raw,
  { type }: TypeDef
): Codec {
  return createTypeUnsafe(registry, type, [data], true);
}

export type BigNumber = BN | string | bigint;
export type TransactionParams = (CodecArg | Partial<CallOverrides>)[];
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
    overrides = { ...(args.pop() as Partial<CallOverrides>) };
  }

  // The ABI coded transaction
  const data = fragment.toU8a(args as CodecArg[]);

  const callParams: CallParams = {
    dest: overrides.dest || contract.address,
    value: overrides.value || new BN("0"),
    gasLimit:
      overrides.gasLimit ||
      contract.signer.gasLimit ||
      contract.api.consts.system.maximumBlockWeight.muln(64).divn(100),
    inputData: data,
  };

  const signer = overrides.signer || contract.signer;

  // Remove the overrides
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

function formatIdentifier(str: string) {
  return stringCamelCase(str);
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
  fragment: AbiMessage,
  isEstimateGas = false
): ContractFunction<ContractCallOutcome> {
  return async function (
    ...args: TransactionParams
  ): Promise<ContractCallOutcome> {
    const { extrinsic, callParams, ...options } = await populateTransaction(
      contract,
      fragment,
      args
    );
    const messageName = formatIdentifier(fragment.identifier);

    const origin = await options.signer.getAddress();

    const params = {
      ...callParams,
      origin,
    };
    log.log("");
    if (!isEstimateGas) {
      log.log(chalk.magenta(`===== Read ${messageName} =====`));
    } else {
      log.log(chalk.magenta(`===== Estimate gas ${messageName} =====`));
    }
    Object.keys(params).map((key) => {
      try {
        let print: string;
        if (isU8a(callParams[key])) {
          print = u8aToHex(callParams[key]);
        } else {
          print = callParams[key].toString();
        }
        log.log(`${key}: `, print);
      } catch {}
    });

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

    if (result.isSuccess) {
      if (!isEstimateGas) {
        log.success(`Output: ${outcome.output?.toString()}`);
      } else {
        log.success(`Output: ${result.asSuccess?.gasConsumed?.toString()}`);
      }
    } else {
      log.error(outcome.result);
    }

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
    const messageName = formatIdentifier(fragment.identifier);

    log.log("");
    log.log(chalk.magenta(`===== Exec ${messageName} =====`));
    Object.keys(callParams).map((key) => {
      try {
        let print: string;
        if (isU8a(callParams[key])) {
          print = u8aToHex(callParams[key]);
        } else {
          print = callParams[key].toString();
        }
        log.log(`${key}: `, print);
      } catch {}
    });

    const response = await buildTx(contract.api.registry, extrinsic, {
      ...options,
    });

    if (!response.error) {
      log.success(`Execute successfully`);
      log.success(
        `${chalk.cyanBright(
          `https://polkadot.js.org/apps/#/explorer/query/${response.blockHash}`
        )}`
      );
    } else {
      log.error(`Execute failed. ${chalk.red(response.error?.message || "")}`);
      response.blockHash &&
        log.info(
          `${chalk.cyanBright(
            `https://polkadot.js.org/apps/#/explorer/query/${response.blockHash}`
          )}`
        );
    }

    return response;
  };
}

function buildEstimate(
  contract: Contract,
  fragment: AbiMessage
): ContractFunction<BN> {
  return async function (...args: TransactionParams): Promise<BN> {
    const call = buildCall(contract, fragment, true);
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
  readonly [key: string]:
    | ContractFunction<ContractCallOutcome>
    | ContractFunction<TransactionResponse>
    | any;

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

    this.callStatic = {};
    this.estimateGas = {};
    this.functions = {};

    this.populateTransaction = {};
    this.address = this.api.registry.createType("AccountId", address);

    for (const fragment of this.abi.messages) {
      const messageName = formatIdentifier(fragment.identifier);

      if (this[messageName] == null) {
        Object.defineProperty(this, messageName, {
          enumerable: true,
          value: buildDefault(this, fragment),
          writable: false,
        });
      }

      if (this.callStatic[messageName] == null) {
        this.callStatic[messageName] = buildCall(this, fragment);
      }

      if (this.populateTransaction[messageName] == null) {
        this.populateTransaction[messageName] = buildPopulate(this, fragment);
      }

      if (this.estimateGas[messageName] == null) {
        this.estimateGas[messageName] = buildEstimate(this, fragment);
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
