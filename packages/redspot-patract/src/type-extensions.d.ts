import { ApiPromise } from "@polkadot/api";
import type { Abi } from "@polkadot/api-contract";
import type { AccountId } from "@polkadot/types/interfaces/types";
import "redspot/types";
import type Contract from "./contract";
import type ContractFactory from "./contractFactory";

declare module "redspot/types" {
  interface RedspotRuntimeEnvironment {
    patract?: {
      api: ApiPromise;
      Contract: typeof Contract;
      ContractFactory: typeof ContractFactory;
      getContractAt(
        contractName: string,
        address: AccountId | string,
        signer?: AccountSigner
      ): Promise<Contract>;
      getContractFactory(
        contractName: string,
        signer?: AccountSigner
      ): Promise<ContractFactory>;
      getAbi(contractName: string): Abi;
      getWasm(contractName: string): string;
      getSigners: () => Promise<AccountSigner[]>;
    };
  }
}
