import type { ApiPromise } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { AccountId } from '@polkadot/types/interfaces/types';
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import type { RuntimeEnvironment } from 'redspot/types';
import { buildTx } from './buildTx';
import Contract from './contract';
import ContractFactory from './contractFactory';
import { Signer } from './signer';

export async function getSigners(env: RuntimeEnvironment): Promise<Signer[]> {
  const keyringpairs = await env.network.provider.getKeyringPairs();
  return keyringpairs.map((pair) => {
    const signer = getSigner(env, pair);
    return signer;
  });
}

export function getSigner(env: RuntimeEnvironment, pair: KeyringPair): Signer {
  const signer = new Signer(env.network.provider.registry, pair);
  signer.setGasLimit(env.network.provider.gasLimit);
  signer.setApi(env.patract.api);
  return signer;
}

export async function getRandomSigner(
  env: RuntimeEnvironment,
  from?: Signer,
  amount?: BN | number | string | BigInt
): Promise<Signer> {
  const api: ApiPromise = await env.patract.connect();
  await cryptoWaitReady();
  const mnemonic = mnemonicGenerate();
  const keyringPair = env.network.provider.keyring.addFromMnemonic(mnemonic);
  const newAccount = getSigner(env, keyringPair);

  log.info(`Generate random signer: ${chalk.cyan(keyringPair.address)}`);
  log.info(`Mnemonic: ${chalk.cyan(mnemonic)}`);
  if (from && amount) {
    try {
      const result = await buildTx(
        api.registry,
        api.tx.balances.transfer(keyringPair.address, amount),
        {
          signer: from
        }
      );
    } catch (error) {
      log.error(`Transfer failed`);
      log.error(error.error);
      throw error;
    }

    log.info(
      `Transfer ${chalk.yellow(amount.toString())} from ${chalk.cyan(
        from.address.toString()
      )} to ${chalk.cyan(keyringPair.address)}`
    );

    return newAccount;
  }

  return newAccount;
}

export async function getContractFactory(
  env: RuntimeEnvironment,
  contractName: string,
  signer?: Signer
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
  env: RuntimeEnvironment,
  contractName: string,
  address: AccountId | string,
  signer?: Signer
) {
  const api: ApiPromise = await env.patract.connect();

  const abi = getAbi(env, contractName);

  if (!signer) {
    const signers = await getSigners(env);
    signer = signers[0];
  }

  return new Contract(address, abi, api, signer);
}

export function getAbi(env: RuntimeEnvironment, contractName: string) {
  const registry = env.network.provider.registry;
  const abiJSON = env.artifacts.readAbiSync(contractName);
  const abi = new Abi(
    abiJSON as any,
    registry.createType('ChainProperties', {
      tokenDecimals: env.network.provider.registry.chainDecimals,
      ss58Format: env.network.provider.registry.chainSS58,
      tokenSymbol: env.network.provider.registry.chainToken
    })
  );

  return abi;
}

export function getWasm(env: RuntimeEnvironment, contractName: string) {
  const wasmCode = env.artifacts.readWasmSync(contractName);

  return wasmCode;
}
