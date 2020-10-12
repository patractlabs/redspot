import { KeyringPair } from "@polkadot/keyring/types";
import { readWasm } from "@redspot/buidler/plugins";
import Api from "./api";

export default class ContractFactory {
  readonly #api: Api;

  constructor(api: Api) {
    this.#api = api;
  }

  public async putCode(
    contractName: string,
    signer: KeyringPair
  ): Promise<string> {
    const outDir = this.#api.paths.artifacts;

    const wasmCode = await readWasm(outDir, contractName);

    const extrinsic = this.#api.tx.contracts.putCode(`0x${wasmCode}`);

    const status = await this.#api.extrinsicHelper(extrinsic, signer);
    const record = status.result.findRecord("contracts", "CodeStored");

    const codeHash = record?.event.data[0].toHex();

    return codeHash;
  }

  public async deploy(
    signer: KeyringPair,
    codeHash: string,
    inputData: any,
    _endowment?: number,
    _gasRequired?: number
  ): Promise<string> {
    const endowment = this.#api.network.provider.endowment;
    const gasRequired = this.#api.network.provider.gasLimit;

    const extrinsic = this.#api.tx.contracts.instantiate(
      endowment,
      gasRequired,
      codeHash,
      inputData
    );

    const status = await this.#api.extrinsicHelper(extrinsic, signer);

    const record = status.result.findRecord("contracts", "Instantiated");

    const address = record.event.data[1];

    return address.toString();
  }
}
