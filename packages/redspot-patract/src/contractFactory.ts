import { ApiPromise } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type { AbiConstructor } from '@polkadot/api-contract/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import {Bytes, u128} from '@polkadot/types';
import type { Weight } from '@polkadot/types/interfaces';
import type { CodeHash } from '@polkadot/types/interfaces/contracts';
import type { AccountId } from '@polkadot/types/interfaces/types';
import type { AnyJson, ISubmittableResult } from '@polkadot/types/types';
import {
  compactAddLength,
  compactStripLength,
  isFunction,
  u8aConcat,
  u8aToHex,
  u8aToU8a
} from '@polkadot/util';
import { blake2AsU8a, decodeAddress } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import { RedspotPluginError } from 'redspot/plugins';
import type { Signer } from 'redspot/types';
import { buildTx } from './buildTx';
import Contract from './contract';
import { converSignerToAddress } from './helpers';
import { BigNumber, CallOverrides, TransactionParams } from './types';

export type ContractFunction<T = any> = (...args: Array<any>) => Promise<T>;

type ContractAbi = Record<string, unknown> | Abi;
type ConstructorOrId = AbiConstructor | string | number;
const pluginName = 'redspot-patract';

export default class ContractFactory {
  readonly abi: Abi;
  readonly wasm: Uint8Array;
  readonly api: ApiPromise;
  readonly signer: string;
  public gasLimit?: BigNumber;

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

  /**
   * @param wasm contract wasm
   * @param contractAbi contract abi
   * @param apiProvider api promise
   * @param signer signer
   */
  constructor(
    wasm: Uint8Array | string | Buffer,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: Signer | string
  ) {
    this.abi =
      contractAbi instanceof Abi
        ? contractAbi
        : new Abi(contractAbi, apiProvider.registry.getChainProperties());

    this.wasm = u8aToU8a(wasm);
    this.api = apiProvider;
    this.signer = converSignerToAddress(signer);

    this.populateTransaction = {
      putCode: this.#buildPutCode,
      instantiate: this.#buildInstantiate
    };
  }

  #buildPutCode = (wasmCode: Uint8Array | string | Buffer) => {
    return this.api.tx.contracts.putCode(wasmCode);
  };

  #buildInstantiateWithCode = (
    wasmCode: Uint8Array | string | Buffer,
    data: string | Uint8Array | Bytes,
    endowment: BigNumber,
    gasLimit: BigNumber,
    salt?: Uint8Array | string | null
  ) => {
    const hasStorageDeposit =
      this.api.tx.contracts.instantiateWithCode.meta.args.length === 6;
    const storageDepositLimit = null;

    return hasStorageDeposit
      ? this.api.tx.contracts.instantiateWithCode(
          endowment,
          gasLimit,
          storageDepositLimit,
          wasmCode,
          u8aConcat(data, salt),
          // @ts-ignore
          salt
        )
      : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore old style without storage deposit
        this.api.tx.contracts.instantiateWithCode(
          endowment,
          gasLimit,
          wasmCode,
          u8aConcat(data, salt),
          salt
        );
  };

  #buildInstantiate = (
    codeHash: string | Uint8Array | CodeHash,
    data: string | Uint8Array | Bytes,
    endowment: BigNumber,
    gasLimit: BigNumber,
    salt?: Uint8Array | string | null
  ) => {
    const withSalt = this.api.tx.contracts.instantiate.meta.args.length === 5;
    const hasStorageDeposit =
      this.api.tx.contracts.instantiateWithCode.meta.args.length === 6;
    const storageDepositLimit = null;

    const tx = withSalt
      ? this.api.tx.contracts.instantiate(
          endowment,
          gasLimit,
          codeHash,
          u8aConcat(data, salt),
          salt
        )
      : hasStorageDeposit
      ? this.api.tx.contracts.instantiate(
          endowment,
          gasLimit,
          storageDepositLimit,
          codeHash,
          u8aConcat(data, salt),
          //@ts-ignore
          salt
        )
      : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore new style with salt included
        this.api.tx.contracts.instantiate(endowment, gasLimit, codeHash, data);

    return tx;
  };

  /**
   * Uploading wasm . wasm will read from a local file
   *
   * @param overrides CallOverrides
   */
  #putCode = async (overrides?: Partial<CallOverrides>): Promise<CodeHash> => {
    const options = { ...overrides };

    const wasmHash = (this.abi.json as any).source.hash;

    const codeStorage = await this.api.query.contracts.codeStorage(wasmHash);

    if (!codeStorage.isEmpty) {
      const hash = this.api.registry.createType('CodeHash', wasmHash) as CodeHash;
      log.info(`Use the uploaded codehash: ${hash.toString()}`);
      return hash;
    }

    delete options.value;
    delete options.gasLimit;
    delete options.dest;

    const contractName = this.abi.info.contract.name.toString();
    const wasmCode = u8aToHex(this.wasm);
    log.info('');
    log.info(chalk.magenta(`===== PutCode ${contractName} =====`));
    log.info(
      'WasmCode: ',
      wasmCode.replace(/^(\w{32})(\w*)(\w{30})$/g, '$1......$3')
    );

    const tx = this.#buildPutCode(wasmCode);

    const status = await buildTx(this.api.registry, tx, this.signer, {
      ...options
    }).catch((error) => {
      log.error(error.error || error);
      throw new RedspotPluginError(pluginName, 'PutCode failed');
    });

    // const record = status.result.findRecord('contracts', 'CodeStored');
    const records = status.result.filterRecords('contracts', 'CodeStored');
    // There may be multiple Instantiated events
    const record = records[records.length - 1];
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
  };

  /**
   * Instantiated Contracts
   *
   * @param constructorOrId Constructor name or constructor id
   * @param args Parameters of the constructor
   * @returns Contract Address
   */
  public instantiate = async (
    constructorOrId: ConstructorOrId,
    ...args: TransactionParams
  ): Promise<AccountId> => {
    const { params, overrides } = this._parseArgs(constructorOrId, ...args);

    const contractName = this.abi.info.contract.name.toString();
    const codeHash = (this.abi.json as any).source.hash;
    const constructor = this.abi.findConstructor(constructorOrId);
    const encoded = constructor.toU8a(params);
    const tombstoneDeposit = (
      (this.api.consts.contracts.tombstoneDeposit as any) || new BN(0)
    ).muln(10);
    const contractDeposit =
      (this.api.consts.contracts.contractDeposit as any) || new BN(0);
    const mindeposit = (this.api.consts.balances.existentialDeposit as u128)
      .add(tombstoneDeposit)
      .add(contractDeposit);
    const endowment = overrides.value;

    if (overrides.value) {
      const endowmentConverted = this.api.createType(
        'BalanceOf',
        overrides.value
      ) as u128;
      if (endowmentConverted.lt(mindeposit)) {
        throw new Error(
          `endowment should not be less than ${mindeposit.toString()}, but get ${endowmentConverted.toString()}`
        );
      }
    }

    const salt = await ContractFactory.encodeSalt(overrides.salt, this.signer);
    const maximumBlockWeight = this.api.consts.system.blockWeights
      ? (this.api.consts.system.blockWeights as unknown as { maxBlock: Weight }).maxBlock
      : (this.api.consts.system.maximumBlockWeight as Weight);

    const gasLimit =
      overrides.gasLimit ||
      this.gasLimit ||
      maximumBlockWeight.muln(2).divn(10);

    delete overrides.value;
    delete overrides.gasLimit;
    delete overrides.dest;
    delete overrides.salt;

    const tx = this.#buildInstantiate(
      codeHash,
      encoded,
      endowment,
      gasLimit,
      salt
    );

    log.info('');
    log.info(chalk.magenta(`===== Instantiate ${contractName} =====`));
    log.info('Endowment: ', endowment.toString());
    log.info('GasLimit: ', gasLimit.toString());
    log.info('CodeHash: ', codeHash.toString());
    log.info('InputData: ', u8aToHex(encoded));
    log.info('Salt: ', salt.toString());

    const status = await buildTx(this.api.registry, tx, this.signer, {
      ...overrides
    }).catch((error) => {
      log.error(error.error || error);
      throw new RedspotPluginError(pluginName, 'Instantiation failed');
    });

    const records = status.result.filterRecords('contracts', 'Instantiated');
    // There may be multiple Instantiated events
    const record = records[records.length - 1];
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
  };

  /**
   * instantiateWithCode
   *
   * @param constructorOrId Constructor name or constructor id
   * @param args Parameters of the constructor
   * @returns Contract Address
   */
  public instantiateWithCode = async (
    constructorOrId: ConstructorOrId,
    ...args: TransactionParams
  ): Promise<AccountId> => {
    const { params, overrides } = this._parseArgs(constructorOrId, ...args);

    const contractName = this.abi.info.contract.name.toString();
    const wasmCode = u8aToHex(this.wasm);

    const constructor = this.abi.findConstructor(constructorOrId);
    const encoded = constructor.toU8a(params);
    const tombstoneDeposit = (
      (this.api.consts.contracts.tombstoneDeposit as any) || new BN(0)
    ).muln(10);
    const contractDeposit =
      (this.api.consts.contracts.contractDeposit as any) || new BN(0);
    const mindeposit = (this.api.consts.balances.existentialDeposit as u128)
      .add(tombstoneDeposit)
      .add(contractDeposit);
    const endowment = overrides.value || mindeposit;

    if (overrides.value) {
      const endowmentConverted = this.api.createType(
        'BalanceOf',
        overrides.value
      ) as u128;
      if (endowmentConverted.lt(mindeposit)) {
        throw new Error(
          `endowment should not be less than ${mindeposit.toString()}, but get ${endowmentConverted.toString()}`
        );
      }
    }
    const salt = await ContractFactory.encodeSalt(overrides.salt, this.signer);
    const maximumBlockWeight = this.api.consts.system.blockWeights
        // @ts-ignore
      ? this.api.consts.system.blockWeights.maxBlock
      : (this.api.consts.system.maximumBlockWeight as Weight);

    const gasLimit =
      overrides.gasLimit ||
      this.gasLimit ||
      maximumBlockWeight.muln(2).divn(10);

    delete overrides.value;
    delete overrides.gasLimit;
    delete overrides.dest;
    delete overrides.salt;

    const tx = this.#buildInstantiateWithCode(
      wasmCode,
      encoded,
      endowment,
      gasLimit,
      salt
    );

    log.info('');
    log.info(chalk.magenta(`===== InstantiateWithCode ${contractName} =====`));
    log.info('Endowment: ', endowment.toString());
    log.info('GasLimit: ', gasLimit.toString());
    log.info('CodeHash: ', (this.abi.json as any).source.hash);
    log.info('InputData: ', u8aToHex(encoded));
    log.info('Salt: ', salt.toString());

    const status = await buildTx(this.api.registry, tx, this.signer, {
      ...overrides
    }).catch((error) => {
      log.error(error.error || error);
      throw new RedspotPluginError(pluginName, 'Instantiation failed');
    });

    const records = status.result.filterRecords('contracts', 'Instantiated');
    // There may be multiple Instantiated events
    const record = records[records.length - 1];
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
  };

  /**
   * Upload wasm and instantiate it.
   *
   * @param constructorOrId Constructor name or constructor id
   * @param args Parameters of the constructor
   * @returns Contract
   */
  async deploy(
    constructorOrId: ConstructorOrId,
    ...args: TransactionParams
  ): Promise<Contract> {
    const { params, overrides } = this._parseArgs(constructorOrId, ...args);

    let contractAddress: AccountId;
    if (!isFunction(this.api.tx.contracts.instantiateWithCode)) {
      await this.#putCode(overrides);
      contractAddress = await this.instantiate(
        constructorOrId,
        ...params,
        overrides
      );
    } else {
      contractAddress = await this.instantiateWithCode(
        constructorOrId,
        ...params,
        overrides
      );
    }

    const contract = new Contract(
      contractAddress,
      this.abi,
      this.api,
      this.signer
    );

    contract.gasLimit = this.gasLimit;

    return contract;
  }

  /**
   * Deploys a contract, and if the same contract address is detected, returns an instance of that contract.
   *
   * @param constructorOrId Constructor name or constructor id
   * @param args Parameters of the constructor
   */
  async deployed(constructorOrId: ConstructorOrId, ...args: TransactionParams) {
    const { params, overrides } = this._parseArgs(constructorOrId, ...args);

    const deployedAddress = await this.getContractAddress(
      constructorOrId,
      params,
      overrides.salt
    );

    console.log('deployedAddress:', deployedAddress.toString());

    const contractInfo = await this.api.query.contracts.contractInfoOf(
      deployedAddress
    );

    if (contractInfo.isEmpty) {
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
      deployedAddress.toString(),
      this.abi,
      this.api,
      this.signer
    );

    contract.gasLimit = this.gasLimit;

    return contract;
  }

  /**
   * Calculate the contract address
   *
   * @param constructorOrId Constructor name or constructor id
   * @param params Parameters of the constructor
   *
   * @returns Contract address
   */
  async getContractAddress(
    constructorOrId: ConstructorOrId,
    params: unknown[],
    salt?: Uint8Array | string | null
  ) {
    const withSalt = this.api.tx.contracts.instantiate.meta.args.length === 5;

    if (withSalt) {
      const encodedSalt = await ContractFactory.encodeSalt(salt, this.signer);
      const codeHash = blake2AsU8a(this.wasm);

      const [_, encodedStrip] = compactStripLength(encodedSalt);

      const buf = u8aConcat(decodeAddress(this.signer), codeHash, encodedStrip);
      const address = blake2AsU8a(buf);

      return this.api.registry.createType('AccountId', address);
    } else {
      const codeHash = blake2AsU8a(this.wasm);

      const constructor = this.abi.findConstructor(constructorOrId);
      const encoded = constructor.toU8a(params);
      const [_, encodedStrip] = compactStripLength(encoded);

      const dataHash = blake2AsU8a(encodedStrip);
      const buf = u8aConcat(codeHash, dataHash, decodeAddress(this.signer));
      const address = blake2AsU8a(buf);

      return this.api.registry.createType('AccountId', address);
    }
  }

  /**
   * Create Contract Instances by Contract Address
   *
   * @param address Contract address
   * @returns Contract
   */
  attach(address: string): Contract {
    return (<any>this.constructor).getContract(
      address,
      this.abi,
      this.api,
      this.signer
    );
  }

  /**
   * Change contract signer
   *
   * @param signer Signer
   * @returns Contract Factory
   */
  connect(signer: Signer | string) {
    return new (<{ new (...args: any[]): ContractFactory }>this.constructor)(
      this.wasm,
      this.abi,
      this.api,
      signer
    );
  }

  _parseArgs(constructorOrId: ConstructorOrId, ...args: TransactionParams) {
    let overrides: Partial<CallOverrides> = {};

    if (overrides.signer) {
      throw new Error(
        'Signer is not supported. Use connect instead, e.g. contractFactory.connect(signer)'
      );
    }

    let params: unknown[] = [];

    const constructor = this.abi.findConstructor(constructorOrId);

    if (
      args.length === constructor.args.length + 1 &&
      typeof args[args.length - 1] === 'object'
    ) {
      overrides = { ...(args[args.length - 1] as Partial<CallOverrides>) };
      params = [...args.slice(0, -1)];
    } else if (args.length !== constructor.args.length) {
      throw new RedspotPluginError(
        pluginName,
        `Expected ${constructor.args.length} arguments to contract message '${constructor.identifier}', found ${args.length}`
      );
    } else {
      params = [...(args as unknown[])];
    }

    return {
      overrides,
      params
    };
  }

  static async encodeSalt(
    salt: Uint8Array | string | null = '',
    signerAddress?: string
  ): Promise<Uint8Array> {
    const EMPTY_SALT = new Uint8Array();

    return salt instanceof Bytes
      ? salt
      : salt && salt.length
      ? compactAddLength(u8aToU8a(salt))
      : EMPTY_SALT;
  }

  /**
   * Create Contract Instances
   *
   * @param address Contract address
   * @param contractAbi Contract abi
   * @param apiProvider Api promise
   * @param signer Signer
   * @returns Contract
   */
  static getContract(
    address: string,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: Signer | string
  ): Contract {
    return new Contract(address, contractAbi, apiProvider, signer);
  }
}
