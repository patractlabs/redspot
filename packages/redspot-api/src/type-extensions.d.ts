import "@nomiclabs/buidler/types";
import Api from "./api";
import { RegistryTypes } from "@polkadot/types/types";

declare module "redspot/types" {
  function getContractFactory(
    name: string,
    signer?: ethers.Signer
  ): Promise<ethers.ContractFactory>;
  function getContractFactory(
    abi: any[],
    bytecode: ethers.utils.BytesLike | string,
    signer?: ethers.Signer
  ): Promise<ethers.ContractFactory>;

  interface BuidlerRuntimeEnvironment {
    api?: Api;
  }
}
