import { ApiPromise } from "@polkadot/api";
import { Abi } from "@polkadot/api-contract";
import type { AbiConstructor } from "@polkadot/api-contract/types";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { Bytes } from "@polkadot/types";
import type { CodeHash } from "@polkadot/types/interfaces/contracts";
import type { AccountId } from "@polkadot/types/interfaces/types";
import type { AnyJson, ISubmittableResult } from "@polkadot/types/types";
import { CodecArg } from "@polkadot/types/types";
import { isU8a, u8aToHex, u8aToU8a } from "@polkadot/util";
import BN from "bn.js";
import chalk from "chalk";
import log from "redspot/internal/log";
import { RedspotPluginError } from "redspot/plugins";
import type { AccountSigner } from "redspot/types";
import { buildTx } from "./buildTx";
import Contract from "./contract";

export type ContractFunction<T = any> = (...args: Array<any>) => Promise<T>;

type ContractAbi = AnyJson | Abi;

const pluginName = "redspot-patract";

export default class ContractFactory {
  readonly abi: Abi;
  readonly wasm: Uint8Array;
  readonly api: ApiPromise;
  readonly signer: AccountSigner;

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
      instantiate: this._buildInstantiate,
    };
    this.abi;
  }

  _buildPutCode() {
    return this.api.tx.contracts.putCode(this.wasm);
  }

  _buildInstantiate(
    codeHash: string | Uint8Array | CodeHash,
    data: string | Uint8Array | Bytes,
    endowment: BN | string,
    gasLimit: BN | string
  ) {
    return this.api.tx.contracts.instantiate(
      endowment,
      gasLimit,
      codeHash,
      data
    );
  }

  async putCode(): Promise<CodeHash> {
    const tx = this._buildPutCode();

    const contractName = this.abi.project.contract.name;

    log.log("");
    log.log(chalk.magenta(`===== PutCode ${contractName} =====`));
    log.log(
      "WasmCode: ",
      u8aToHex(this.wasm).replace(/^(\w{32})(\w*)(\w{30})$/g, "$1......$3")
    );

    const status = await buildTx(this.api.registry, tx, {
      signer: this.signer,
    });
    const record = status.result.findRecord("contracts", "CodeStored");

    const codeHash = record?.event.data[0] as CodeHash;

    if (!codeHash) {
      throw new RedspotPluginError(
        pluginName,
        `Can't get codehash for contracts`
      );
    }

    log.log(`➤ ${contractName} codeHash: ${chalk.blue(codeHash.toHex())}`);

    return codeHash;
  }

  async instantiate(
    codeHash: string | Uint8Array | CodeHash,
    constructorOrId: AbiConstructor | string | number,
    ...params: CodecArg[]
  ): Promise<AccountId> {
    const contractName = this.abi.project.contract.name;

    const constructor = this.abi.findConstructor(constructorOrId);
    const encoded = constructor.toU8a(params);
    const endowment = this.signer.endowment;
    const gasLimit = this.signer.gasLimit;

    const tx = this._buildInstantiate(codeHash, encoded, endowment, gasLimit);

    log.log("");
    log.log(chalk.magenta(`===== Instantiate ${contractName} =====`));
    log.log("Endowment: ", endowment.toString());
    log.log("GasLimit: ", gasLimit.toString());
    log.log(
      "CodeHash: ",
      isU8a(codeHash) ? u8aToHex(codeHash) : codeHash.toString()
    );
    log.log("InputData: ", u8aToHex(encoded));

    const status = await buildTx(this.api.registry, tx, {
      signer: this.signer,
    });
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
    const codeHash = await this.putCode();
    const contractAddress = await this.instantiate(
      codeHash,
      constructorOrId,
      ...params
    );

    const contract = new Contract(
      contractAddress,
      this.abi,
      this.api,
      this.signer
    );

    return contract;
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

  static getContract(
    address: string,
    contractAbi: ContractAbi,
    apiProvider: ApiPromise,
    signer: AccountSigner
  ): Contract {
    return new Contract(address, contractAbi, apiProvider, signer);
  }
}
