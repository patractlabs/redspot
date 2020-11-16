import { ApiPromise } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type {
  AbiMessage,
  AbiEvent,
  ContractCallOutcome
} from '@polkadot/api-contract/types';
import type { SignerOptions, SubmittableExtrinsic } from '@polkadot/api/types';
import { createTypeUnsafe, Raw } from '@polkadot/types';
import type { AccountId, ContractExecResult } from '@polkadot/types/interfaces';
import type {
  AnyJson,
  CodecArg,
  ISubmittableResult
} from '@polkadot/types/types';
import { Codec, Registry, TypeDef } from '@polkadot/types/types';
import {
  assert,
  isObject,
  isU8a,
  stringCamelCase,
  stringUpperFirst,
  u8aToHex
} from '@polkadot/util';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import type { AccountSigner } from 'redspot/types';
import { buildTx, TransactionResponse } from './buildTx';
import { SubmittableResult } from '@polkadot/api';

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
  extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>;
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

export interface DecodedEvent {
  args: Codec[];
  name: string;
  event: AbiEvent;
}

async function populateTransaction(
  contract: Contract,
  fragment: AbiMessage,
  args: TransactionParams
): Promise<PopulatedTransaction> {
  let overrides: Partial<CallOverrides> = {};

  if (
    args.length === fragment.args.length + 1 &&
    typeof args[args.length - 1] === 'object'
  ) {
    overrides = { ...(args.pop() as Partial<CallOverrides>) };
  }

  // The ABI coded transaction
  const data = fragment.toU8a(args as CodecArg[]);

  const callParams: CallParams = {
    dest: overrides.dest || contract.address,
    value: overrides.value || new BN('0'),
    gasLimit:
      overrides.gasLimit ||
      contract.signer.gasLimit ||
      contract.api.consts.system.maximumBlockWeight.muln(2).divn(10),
    inputData: data
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
    )
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

function decodeEvents(
  records: SubmittableResult,
  abi: Abi
): DecodedEvent[] | undefined {
  const events = records.filterRecords('contracts', 'ContractExecution');

  if (!events.length) {
    return undefined;
  }

  return events.map((event) => {
    const decoded = abi.decodeEvent(event.event.data[1] as any) as Partial<
      DecodedEvent
    >;
    decoded.name = stringUpperFirst(stringCamelCase(decoded.event.identifier));

    return decoded as DecodedEvent;
  });
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
      origin
    };
    log.log('');
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

    const json = await contract.api.rpc.contracts.call.json({
      ...callParams,
      origin
    });

    const { debugMessage, gasConsumed, result } = mapExecResult(
      contract.api.registry,
      json.toJSON()
    );

    const outcome = {
      debugMessage,
      gasConsumed,
      output:
        result.isOk && fragment.returnType
          ? formatData(
              contract.api.registry,
              result.asOk.data,
              fragment.returnType
            )
          : null,
      result
    };

    if (result.isOk) {
      if (!isEstimateGas) {
        log.success(`Output: ${outcome.output?.toString()}`);
      } else {
        log.success(`Output: ${outcome.gasConsumed.toString()}`);
      }
    } else {
      log.error(outcome.debugMessage);
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

    log.log('');
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
      ...options
    });

    response.events = decodeEvents(response.result, contract.abi);

    let url: string;
    let base = 'https://polkadot.js.org/apps/#/explorer/query/';

    try {
      // @ts-ignore
      url = `${contract.api._rpcCore.provider.extra.explorerUrl || base}${
        response.blockHash
      }`;
    } catch {
      url = `${base}${response.blockHash}`;
    }

    if (!response.error) {
      log.success(`Execute successfully`);
      log.success(`${chalk.cyanBright(url)}`);
    } else {
      log.error(`Execute failed. ${chalk.red(response.error?.message || '')}`);
      response.blockHash && log.info(`${chalk.cyanBright(url)}`);
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
    if (callResult.result.isErr) {
      return new BN('0');
    } else {
      return new BN(callResult.gasConsumed);
    }
  };
}

function mapExecResult(registry: Registry, json: AnyJson): ContractExecResult {
  assert(
    isObject(json) && !Array.isArray(json),
    'Invalid JSON result retrieved'
  );

  if (!Object.keys(json).some((key) => ['error', 'success'].includes(key))) {
    return registry.createType('ContractExecResult', json);
  }

  const from = registry.createType('ContractExecResultTo260', json);

  if (from.isSuccess) {
    const s = from.asSuccess;

    return registry.createType('ContractExecResult', {
      gasConsumed: s.gasConsumed,
      result: {
        ok: {
          data: s.data,
          flags: s.flags
        }
      }
    });
  }

  // in the old format error has no additional information,
  // map it as-is with an "unknown" error
  return registry.createType('ContractExecResult', {
    result: { err: { other: 'unknown' } }
  });
}

export default class Contract {
  public readonly address: AccountId;
  public readonly abi: Abi;
  public readonly signer: AccountSigner;
  public readonly api: ApiPromise;
  public readonly functions: { [name: string]: ContractFunction };
  public readonly query: {
    [name: string]: ContractFunction<ContractCallOutcome>;
  };
  public readonly tx: { [name: string]: ContractFunction<TransactionResponse> };
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
    this.address = apiProvider.registry.createType('AccountId', address);

    this.abi =
      contractAbi instanceof Abi
        ? contractAbi
        : new Abi(contractAbi, apiProvider.registry.getChainProperties());

    this.api = apiProvider;
    this.signer = signer;

    this.query = {};
    this.tx = {};
    this.estimateGas = {};
    this.functions = {};

    this.populateTransaction = {};
    this.address = this.api.registry.createType('AccountId', address);

    for (const fragment of this.abi.messages) {
      const messageName = formatIdentifier(fragment.identifier);

      if (this[messageName] == null) {
        Object.defineProperty(this, messageName, {
          enumerable: true,
          value: buildDefault(this, fragment),
          writable: false
        });
      }

      if (this.query[messageName] == null) {
        this.query[messageName] = buildCall(this, fragment);
      }

      if (this.tx[messageName] == null) {
        this.tx[messageName] = buildSend(this, fragment);
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
