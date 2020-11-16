import { ApiPromise } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type { AbiConstructor } from '@polkadot/api-contract/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { Bytes } from '@polkadot/types';
import type { CodeHash } from '@polkadot/types/interfaces/contracts';
import type { AccountId } from '@polkadot/types/interfaces/types';
import type { AnyJson, ISubmittableResult } from '@polkadot/types/types';
import { CodecArg } from '@polkadot/types/types';
import {
  compactStripLength,
  isU8a,
  u8aConcat,
  u8aToHex,
  u8aToU8a
} from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import { RedspotPluginError } from 'redspot/plugins';
import type { AccountSigner } from 'redspot/types';
import { buildTx } from './buildTx';
import Contract, {
  CallOverrides,
  TransactionParams,
  BigNumber
} from './contract';

export type ContractFunction<T = any> = (...args: Array<any>) => Promise<T>;

type ContractAbi = AnyJson | Abi;
type ConstructorOrId = AbiConstructor | string | number;
const pluginName = 'redspot-patract';

export default class ContractFactory {
  readonly abi: Abi;
  readonly wasm: Uint8Array;
  readonly api: ApiPromise;
  readonly signer: AccountSigner;

  readonly populateTransaction: {
    putCode: (
      code: string | Bytes | Uint8Array
    ) => SubmittableExtrinsic<'promise', ISubmittableResult>;
    instantiate: (
      codeHash: string | Uint8Array | CodeHash,
      data: string | Uint8Array | Bytes,
      endowment: BigNumber,
      gasLimit: BigNumber
    ) => SubmittableExtrinsic<'promise', ISubmittableResult>;
  };

  constructor(
    wasm: Uint8Array | string | Buffer,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: AccountSigner
  ) {
    this.abi =
      contractAbi instanceof Abi
        ? contractAbi
        : new Abi(contractAbi, apiProvider.registry.getChainProperties());

    this.wasm = u8aToU8a(wasm);
    this.api = apiProvider;
    this.signer = signer;

    this.populateTransaction = {
      putCode: this._buildPutCode,
      instantiate: this._buildInstantiate
    };
    this.abi;
  }

  _buildPutCode(wasmCode: Uint8Array | string | Buffer) {
    return this.api.tx.contracts.putCode(wasmCode);
  }

  _buildInstantiate(
    codeHash: string | Uint8Array | CodeHash,
    data: string | Uint8Array | Bytes,
    endowment: BigNumber,
    gasLimit: BigNumber
  ) {
    return this.api.tx.contracts.instantiate(
      endowment,
      gasLimit,
      codeHash,
      data
    );
  }

  async putCode(overrides?: Partial<CallOverrides>): Promise<CodeHash> {
    const options = { ...overrides };

    const wasmHash = blake2AsU8a(this.wasm);

    const codeStorage = await this.api.query.contracts.codeStorage(
      blake2AsU8a(this.wasm)
    );

    if (!codeStorage.isNone) {
      const hash = this.api.registry.createType('CodeHash', wasmHash);
      log.info(`Use the uploaded codehash: ${hash.toString()}`);
      return hash;
    }

    delete options.value;
    delete options.gasLimit;
    delete options.dest;

    const contractName = this.abi.project.contract.name;
    const wasmCode = u8aToHex(this.wasm);
    log.log('');
    log.log(chalk.magenta(`===== PutCode ${contractName} =====`));
    log.log(
      'WasmCode: ',
      wasmCode.replace(/^(\w{32})(\w*)(\w{30})$/g, '$1......$3')
    );

    const tx = this._buildPutCode(wasmCode);

    const status = await buildTx(this.api.registry, tx, {
      signer: this.signer,
      ...options
    }).catch((error) => {
      log.error(error.error || error);
      throw new RedspotPluginError(pluginName, 'PutCode failed');
    });

    const record = status.result.findRecord('contracts', 'CodeStored');
    const depositRecord = status.result.findRecord('balances', 'Deposit');

    const codeHash = record?.event.data[0] as CodeHash;

    if (!codeHash) {
      throw new RedspotPluginError(
        pluginName,
        `Can't get codehash for contracts`
      );
    }

    if (depositRecord && depositRecord?.event?.data?.[1]) {
      log.success(
        `Transaction fees: ${chalk.yellow(
          depositRecord.event.data[1]?.toString()
        )}`
      );
    }

    log.success(`${contractName} codeHash: ${chalk.blue(codeHash.toHex())}`);

    return codeHash;
  }

  async instantiate(
    codeHash: string | Uint8Array | CodeHash,
    constructorOrId: ConstructorOrId,
    ...args: TransactionParams
  ): Promise<AccountId> {
    const { params, overrides } = this.parseArgs(constructorOrId, ...args);

    const contractName = this.abi.project.contract.name;

    const constructor = this.abi.findConstructor(constructorOrId);
    const encoded = constructor.toU8a(params);
    const mindeposit = this.api.consts.balances.existentialDeposit
      .add(this.api.consts.contracts.tombstoneDeposit)
      .muln(2);
    const endowment = overrides.value || mindeposit;
    const gasLimit =
      overrides.gasLimit ||
      this.signer.gasLimit ||
      this.api.consts.system.maximumBlockWeight.muln(2).divn(10);

    delete overrides.value;
    delete overrides.gasLimit;
    delete overrides.dest;

    const tx = this._buildInstantiate(codeHash, encoded, endowment, gasLimit);

    log.log('');
    log.log(chalk.magenta(`===== Instantiate ${contractName} =====`));
    log.log('Endowment: ', endowment.toString());
    log.log('GasLimit: ', gasLimit.toString());
    log.log(
      'CodeHash: ',
      isU8a(codeHash) ? u8aToHex(codeHash) : codeHash.toString()
    );
    log.log('InputData: ', u8aToHex(encoded));

    const status = await buildTx(this.api.registry, tx, {
      signer: this.signer,
      ...overrides
    }).catch((error) => {
      log.error(error.error || error);
      throw new RedspotPluginError(pluginName, 'Instantiation failed');
    });

    const record = status.result.findRecord('contracts', 'Instantiated');
    const depositRecord = status.result.findRecord('balances', 'Deposit');
    const successRecord = status.result.findRecord(
      'system',
      'ExtrinsicSuccess'
    );

    const address = record.event.data[1] as AccountId;

    if (!address) {
      throw new RedspotPluginError(
        pluginName,
        `The instantiation contract failed`
      );
    }

    if (depositRecord && depositRecord?.event?.data?.[1]) {
      log.success(
        `Transaction fees: ${chalk.yellow(
          depositRecord.event.data[1]?.toString()
        )}`
      );
    }

    if (successRecord && (successRecord?.event?.data?.[0] as any).weight) {
      log.success(
        `The gas consumption of ${contractName} instantiate: ${chalk.yellow(
          (successRecord?.event?.data?.[0] as any).weight.toString()
        )}`
      );
    }

    log.success(`${contractName} address: ${chalk.blue(address.toString())}`);

    return address;
  }

  async deploy(
    constructorOrId: ConstructorOrId,
    ...args: TransactionParams
  ): Promise<Contract> {
    const { params, overrides } = this.parseArgs(constructorOrId, ...args);

    const codeHash = await this.putCode(overrides);
    const contractAddress = await this.instantiate(
      codeHash,
      constructorOrId,
      ...params,
      overrides
    );

    const contract = new Contract(
      contractAddress,
      this.abi,
      this.api,
      this.signer
    );

    return contract;
  }

  async deployed(constructorOrId: ConstructorOrId, ...args: TransactionParams) {
    const { params, overrides } = this.parseArgs(constructorOrId, ...args);

    const deployedAddress = await this.getContractAddress(
      constructorOrId,
      params
    );

    const contractInfo = await this.api.query.contracts.contractInfoOf(
      deployedAddress
    );

    if (contractInfo.isNone) {
      return this.deploy(constructorOrId, ...params, overrides);
    }

    log.warn(
      'The same WASM code and the instantiation parameter contract have been deployed.'
    );
    log.info(
      `Use contracts that have already been deployed: ${chalk.cyan(
        deployedAddress.toString()
      )}`
    );

    const contract = new Contract(
      deployedAddress,
      this.abi,
      this.api,
      this.signer
    );

    return contract;
  }

  async getContractAddress(
    constructorOrId: ConstructorOrId,
    params: CodecArg[]
  ) {
    const codeHash = blake2AsU8a(this.wasm);

    const constructor = this.abi.findConstructor(constructorOrId);
    const encoded = constructor.toU8a(params);
    const [_, encodedStripLength] = compactStripLength(encoded);

    const dataHash = blake2AsU8a(encodedStripLength);
    const buf = u8aConcat(codeHash, dataHash, this.signer.pair.publicKey);
    const address = blake2AsU8a(buf);

    return this.api.registry.createType('AccountId', address);
  }

  attach(address: string): Contract {
    return (<any>this.constructor).getContract(address, this.abi, this.api);
  }

  connect(signer: AccountSigner) {
    return new (<{ new (...args: any[]): ContractFactory }>this.constructor)(
      this.wasm,
      this.abi,
      this.api,
      signer
    );
  }

  parseArgs(constructorOrId: ConstructorOrId, ...args: TransactionParams) {
    let overrides: Partial<CallOverrides> = {};
    let params: CodecArg[] = [];

    const constructor = this.abi.findConstructor(constructorOrId);

    if (
      args.length === constructor.args.length + 1 &&
      typeof args[args.length - 1] === 'object'
    ) {
      overrides = { ...(args[args.length - 1] as Partial<CallOverrides>) };
      params = [...(args.slice(0, -1) as CodecArg[])];
    } else if (args.length !== constructor.args.length) {
      throw new RedspotPluginError(
        pluginName,
        `Expected ${constructor.args.length} arguments to contract message '${constructor.identifier}', found ${args.length}`
      );
    } else {
      params = [...(args as CodecArg[])];
    }

    return {
      overrides,
      params
    };
  }

  static getContract(
    address: string,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: AccountSigner
  ): Contract {
    return new Contract(address, contractAbi, apiProvider, signer);
  }
}
