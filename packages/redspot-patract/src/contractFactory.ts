import { ApiPromise } from "@polkadot/api";
import { Abi } from "@polkadot/api-contract";
import type { AbiConstructor, AbiMessage } from "@polkadot/api-contract/types";
import { encodeMessage } from "@polkadot/api-contract/util";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { Bytes } from "@polkadot/types";
import type { CodeHash } from "@polkadot/types/interfaces/contracts";
import type { AccountId } from "@polkadot/types/interfaces/types";
import type { AnyJson, ISubmittableResult } from "@polkadot/types/types";
import { CodecArg } from "@polkadot/types/types";
import { u8aToU8a } from "@polkadot/util";
import BN from "bn.js";
import { RedspotPluginError } from "redspot/plugins";
import type { AccountSigner } from "redspot/types";
import { buildTx } from "./buildTx";
import Contract from "./contract";

export type ContractFunction<T = any> = (...args: Array<any>) => Promise<T>;

type ContractAbi = AnyJson | Abi;

const pluginName = "redspot-patract";

export class ContractFactory {
  readonly abi: Abi;
  readonly wasm: Uint8Array;
  readonly apiProvider: ApiPromise;
  readonly signer: AccountSigner;
  readonly defaults?: {
    endowment?: BN | string;
    gasLimit?: BN | string;
  };
  readonly populateTransaction: {
    putCode: (
      code: string | Bytes | Uint8Array
    ) => SubmittableExtrinsic<"promise", ISubmittableResult>;
    instantiate: (
      codeHash: string | Uint8Array | CodeHash,
      data: string | Uint8Array | Bytes,
      endowment: BN | string,
      gasLimit: BN | string
    ) => SubmittableExtrinsic<"promise", ISubmittableResult>;
  };

  constructor(
    contractAbi: ContractAbi,
    wasm: Uint8Array | string | Buffer,
    apiProvider: ApiPromise,
    signer: AccountSigner,
    defaults?: {
      endowment?: BN | string;
      gasLimit?: BN | string;
    }
  ) {
    this.abi =
      contractAbi instanceof Abi
        ? contractAbi
        : new Abi(contractAbi, apiProvider.registry.getChainProperties());

    this.wasm = u8aToU8a(wasm);
    this.apiProvider = apiProvider;
    this.signer = signer;
    this.defaults = defaults;

    this.populateTransaction = {
      putCode: this._buildPutCode,
      instantiate: this._buildInstantiate,
    };
    this.abi;
  }

  _buildPutCode() {
    return this.apiProvider.tx.contracts.putCode(this.wasm);
  }

  _buildInstantiate(
    codeHash: string | Uint8Array | CodeHash,
    data: string | Uint8Array | Bytes,
    endowment?: BN | string,
    gasLimit?: BN | string
  ) {
    return this.apiProvider.tx.contracts.instantiate(
      endowment || this.defaults?.endowment,
      gasLimit || this.defaults?.gasLimit,
      codeHash,
      data
    );
  }

  encodeMessage(message: AbiMessage | AbiConstructor, ...params: CodecArg[]) {
    return encodeMessage(this.abi.registry, message, params);
  }

  async putCode(): Promise<CodeHash> {
    const tx = this._buildPutCode();

    const status = await buildTx(tx, this.signer);
    const record = status.result.findRecord("contracts", "CodeStored");

    const codeHash = record?.event.data[0] as CodeHash;

    if (!codeHash) {
      throw new RedspotPluginError(
        pluginName,
        `Can't get codehash for contracts`
      );
    }

    return codeHash;
  }

  async instantiate(
    codeHash: string | Uint8Array | CodeHash,
    constructorOrId: AbiConstructor | string | number,
    ...params: CodecArg[]
  ): Promise<AccountId> {
    const constructor = this.abi.findConstructor(constructorOrId);
    const encoded = this.encodeMessage(constructor, ...params);

    const tx = this._buildInstantiate(codeHash, encoded);

    const status = await buildTx(tx, this.signer);
    const record = status.result.findRecord("contracts", "Instantiated");

    const address = record.event.data[1] as AccountId;

    if (!address) {
      throw new RedspotPluginError(
        pluginName,
        `The instantiation contract failed`
      );
    }

    return address;
  }

  async deploy(
    constructorOrId: AbiConstructor | string | number,
    ...params: CodecArg[]
  ): Promise<Contract> {
    const abiHash = this.abi.project.source.hash;

    const codeHash = await this.putCode();
    const contractAddress = await this.instantiate(
      codeHash,
      constructorOrId,
      ...params
    );
    return new Contract(contractAddress, this.abi, this.apiProvider);
  }

  attach(address: string): Contract {
    return (<any>this.constructor).getContract(
      address,
      this.abi,
      this.apiProvider
    );
  }

  connect(apiProvider: ApiPromise) {
    return new (<{ new (...args: any[]): ContractFactory }>this.constructor)(
      this.abi,
      this.wasm,
      apiProvider
    );
  }

  static getContract(
    address: string,
    contractAbi: ContractAbi,
    apiProvider?: ApiPromise
  ): Contract {
    return new Contract(address, contractAbi, apiProvider);
  }
}
