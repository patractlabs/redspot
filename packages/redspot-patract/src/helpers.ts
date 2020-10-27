import type { ApiPromise } from "@polkadot/api";
import { Abi } from "@polkadot/api-contract";
import type { AccountId } from "@polkadot/types/interfaces/types";
import { readAbiSync, readWasmSync } from "redspot/plugins";
import type { RedspotRuntimeEnvironment } from "redspot/types";
import { AccountSigner } from "redspot/types";
import Contract from "./contract";
import ContractFactory from "./contractFactory";

export async function getSigners(
  env: RedspotRuntimeEnvironment
): Promise<AccountSigner[]> {
  const keyringpairs = await env.network.provider.getKeyringPairs();
  return keyringpairs.map((pair) => {
    return env.network.provider.createSigner(pair);
  });
}

export async function getContractFactory(
  env: RedspotRuntimeEnvironment,
  contractName: string,
  signer?: AccountSigner
) {
  const api: ApiPromise = await env.patract.connect();
  const wasmCode = getWasm(env, contractName);
  const abi = getAbi(env, contractName);

  if (!signer) {
    const signers = await getSigners(env);
    signer = signers[0];
  }

  return new ContractFactory(wasmCode, abi, api, signer);
}

export async function getContractAt(
  env: RedspotRuntimeEnvironment,
  contractName: string,
  address: AccountId | string,
  signer?: AccountSigner
) {
  const api: ApiPromise = await env.patract.connect();

  const abi = getAbi(env, contractName);

  if (!signer) {
    const signers = await getSigners(env);
    signer = signers[0];
  }

  return new Contract(address, abi, api, signer);
}

export function getAbi(env: RedspotRuntimeEnvironment, contractName: string) {
  const paths = env.config.paths;
  const registry = env.network.provider.registry;
  const abiJSON = readAbiSync(paths.artifacts, contractName);
  const abi = new Abi(
    abiJSON as any,
    registry.createType("ChainProperties", {
      tokenDecimals: env.network.provider.registry.chainDecimals,
      ss58Format: env.network.provider.registry.chainSS58,
      tokenSymbol: env.network.provider.registry.chainToken,
    })
  );

  return abi;
}

export function getWasm(env: RedspotRuntimeEnvironment, contractName: string) {
  const paths = env.config.paths;
  const wasmCode = readWasmSync(paths.artifacts, contractName);

  return wasmCode;
}
