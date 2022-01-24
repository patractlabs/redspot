import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type {
  AbiMessage,
  ContractCallOutcome
} from '@polkadot/api-contract/types';
import { createTypeUnsafe } from '@polkadot/types';
import type {
  AccountId,
  EventRecord,
  Weight
} from '@polkadot/types/interfaces';
import {
  isU8a,
  stringCamelCase,
  stringUpperFirst,
  u8aToHex
} from '@polkadot/util';
import { addressEq } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import type { Signer } from 'redspot/types';
import { buildTx } from './buildTx';
import { converSignerToAddress } from './helpers';
import {
  BigNumber,
  CallOverrides,
  CallParams,
  ContractAbi,
  ContractFunction,
  DecodedEvent,
  PopulatedTransaction,
  TransactionParams,
  TransactionResponse
} from './types';

async function populateTransaction(
  contract: Contract,
  fragment: AbiMessage,
  args: TransactionParams
): Promise<PopulatedTransaction> {
  let overrides: Partial<CallOverrides> = {};

  if (overrides.signer) {
    throw new Error(
      'Signer is not supported. Use connect instead, e.g. contract.connect(signer)'
    );
  }

  if (
    args.length === fragment.args.length + 1 &&
    typeof args[args.length - 1] === 'object'
  ) {
    overrides = { ...(args.pop() as Partial<CallOverrides>) };
  }

  // The ABI coded transaction
  const data = fragment.toU8a(args as unknown[]);

  const maximumBlockWeight = contract.api.consts.system.blockWeights
    ? (contract.api.consts.system.blockWeights as unknown as { maxBlock: Weight }).maxBlock
    : (contract.api.consts.system.maximumBlockWeight as Weight);

  const callParams: CallParams = {
    dest: overrides.dest || contract.address,
    value: overrides.value || new BN('0'),
    gasLimit:
      overrides.gasLimit ||
      contract.gasLimit ||
      maximumBlockWeight.muln(2).divn(10),
    inputData: data
  };

  // Remove the overrides
  delete overrides.dest;
  delete overrides.value;
  delete overrides.gasLimit;

  const hasStorageDeposit =
    contract.api.tx.contracts.call.meta.args.length === 5;
  const storageDepositLimit = null;
  const extrinsic = hasStorageDeposit
    ? contract.api.tx.contracts.call(
        callParams.dest,
        callParams.value,
        callParams.gasLimit,
        storageDepositLimit,
        //@ts-ignore
        callParams.inputData
      )
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore old style without storage deposit
      contract.api.tx.contracts.call(
        callParams.dest,
        callParams.value,
        callParams.gasLimit,
        callParams.inputData
      );

  return {
    ...overrides,
    callParams,
    extrinsic
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
  contractAddress: any,
  records: SubmittableResult,
  abi: Abi
): DecodedEvent[] | undefined {
  let events: EventRecord[];

  events = records.filterRecords('contracts', [
    'ContractEmitted',
    'ContractExecution'
  ]);

  events = events.filter((event) => {
    const accountId = event.event.data[0] as AccountId;
    if (!addressEq(accountId, contractAddress)) {
      return false;
    } else {
      return true;
    }
  });

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
    const { extrinsic, callParams } = await populateTransaction(
      contract,
      fragment,
      args
    );
    const messageName = formatIdentifier(fragment.identifier);

    const origin = contract.signer;

    const params = {
      ...callParams,
      origin
    };
    log.info('');

    if (!isEstimateGas) {
      log.info(chalk.magenta(`===== Read ${messageName} =====`));
    } else {
      log.info(chalk.magenta(`===== Estimate gas ${messageName} =====`));
    }

    Object.keys(params).forEach((key) => {
      try {
        let print: string;
        if (isU8a(callParams[key])) {
          print = u8aToHex(callParams[key]);
        } else {
          print = callParams[key].toString();
        }
        log.info(`${key}: `, print);
      } catch {}
    });

    const hasStorageDeposit =
      contract.api.tx.contracts.call.meta.args.length === 5;
    const storageDepositLimit = null;
    const rpcParams = hasStorageDeposit
      ? {
          ...callParams,
          storageDepositLimit,
          origin
        }
      : {
          ...callParams,
          origin
        };

    const json = await contract.api.rpc.contracts.call(rpcParams);

    const { debugMessage, gasRequired, gasConsumed, result, storageDeposit } = json;

    const outcome = {
      debugMessage,
      gasConsumed,
      gasRequired:
        gasRequired && !gasRequired.isZero() ? gasRequired : gasConsumed,
      output:
        result.isOk && fragment.returnType
          ? createTypeUnsafe(
              contract.api.registry,
              fragment.returnType.type,
              [result.asOk.data.toU8a(true)],
              { isPedantic: true }
            )
          : null,
      result,
      storageDeposit: storageDeposit
    };

    if (result.isOk) {
      if (!isEstimateGas) {
        log.success(`Output: ${(outcome.output as any)?.toString()}`);
      } else {
        log.success(`Output: ${outcome.gasConsumed.toString()}`);
      }
    } else {
      log.error(
        `output: ${(outcome.output as any)?.toString()}; debugMessage: ${outcome.debugMessage.toString()}`
      );
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

    log.info('');
    log.info(chalk.magenta(`===== Exec ${messageName} =====`));
    Object.keys(callParams).forEach((key) => {
      try {
        let print: string;
        if (isU8a(callParams[key])) {
          print = u8aToHex(callParams[key]);
        } else {
          print = callParams[key].toString();
        }
        log.info(`${key}: `, print);
      } catch {}
    });

    const response = await buildTx(
      contract.api.registry,
      extrinsic,
      contract.signer,
      {
        ...options
      }
    );

    response.events = decodeEvents(
      callParams.dest,
      response.result,
      contract.abi
    );

    if (!response.error) {
      log.success(`Execute successfully`);
    } else {
      log.error(`Execute failed. ${chalk.red(response.error?.message || '')}`);
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

// function mapExecResult(registry: Registry, json: AnyJson): ContractExecResult {
//   assert(
//     isObject(json) && !Array.isArray(json),
//     'Invalid JSON result retrieved'
//   );

//   if (!Object.keys(json).some((key) => ['error', 'success'].includes(key))) {
//     return registry.createType('ContractExecResult', json);
//   }

//   const from = registry.createType('ContractExecResultTo260', json);

//   if (from.isSuccess) {
//     const s = from.asSuccess;

//     return registry.createType('ContractExecResult', {
//       gasConsumed: s.gasConsumed,
//       result: {
//         ok: {
//           data: s.data,
//           flags: s.flags
//         }
//       }
//     });
//   }

//   // in the old format error has no additional information,
//   // map it as-is with an "unknown" error
//   return registry.createType('ContractExecResult', {
//     result: { err: { other: 'unknown' } }
//   });
// }

export default class Contract {
  public readonly address: AccountId;
  public readonly abi: Abi;
  public readonly signer: string;
  public readonly api: ApiPromise;
  public readonly functions: { [name: string]: ContractFunction };
  public readonly query: {
    [name: string]: ContractFunction<ContractCallOutcome>;
  };

  public readonly tx: { [name: string]: ContractFunction<TransactionResponse> };

  /**
   * Estimated gas
   */
  public readonly estimateGas: { [name: string]: ContractFunction<BN> };

  public readonly populateTransaction: {
    [name: string]: ContractFunction<PopulatedTransaction>;
  };

  // The meta-class properties
  readonly [key: string]:
    | ContractFunction<ContractCallOutcome>
    | ContractFunction<TransactionResponse>
    | any;

  public gasLimit?: BigNumber;

  constructor(
    address: string | AccountId,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: Signer | string
  ) {
    this.address = apiProvider.registry.createType('AccountId', address);

    this.abi =
      contractAbi instanceof Abi
        ? contractAbi
        : new Abi(contractAbi, apiProvider.registry.getChainProperties());

    this.api = apiProvider;
    this.signer = converSignerToAddress(signer);

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

  /**
   * Change contract signer
   *
   * @param signer Signer
   * @returns Contract
   */
  connect(signer: Signer | string): Contract {
    const contract = new (<{ new (...args: any[]): Contract }>this.constructor)(
      this.address,
      this.abi,
      this.api,
      signer
    );

    return contract;
  }

  /**
   * Create Contract Instances by Contract Address
   *
   * @param address Contract address
   * @returns Contract
   */
  attach(address: string): Contract {
    return new (<{ new (...args: any[]): Contract }>this.constructor)(
      address,
      this.abi,
      this.api,
      this.signer
    );
  }
}
