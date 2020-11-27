import type { ApiPromise } from '@polkadot/api';
import { Abi } from '@polkadot/api-contract';
import type { AccountId } from '@polkadot/types/interfaces/types';
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import { readAbiSync, readWasmSync } from 'redspot/plugins';
import type { RedspotRuntimeEnvironment } from 'redspot/types';
import { AccountSigner } from 'redspot/types';
import { buildTx } from './buildTx';
import Contract from './contract';
import ContractFactory from './contractFactory';

export async function getSigners(
  env: RedspotRuntimeEnvironment
): Promise<AccountSigner[]> {
  const keyringpairs = await env.network.provider.getKeyringPairs();
  return keyringpairs.map((pair) => {
    return env.network.provider.createSigner(pair);
  });
}

export async function getRandomSigner(
  env: RedspotRuntimeEnvironment,
  from?: AccountSigner,
  amount?: BN | string | number
): Promise<AccountSigner> {
  const api: ApiPromise = await env.patract.connect();
  await cryptoWaitReady();
  const mnemonic = mnemonicGenerate();
  const keyringPair = env.network.provider.keyring.addFromMnemonic(mnemonic);
  const newAccount = env.network.provider.createSigner(keyringPair);
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
    registry.createType('ChainProperties', {
      tokenDecimals: env.network.provider.registry.chainDecimals,
      ss58Format: env.network.provider.registry.chainSS58,
      tokenSymbol: env.network.provider.registry.chainToken
    })
  );

  return abi;
}

export function getWasm(env: RedspotRuntimeEnvironment, contractName: string) {
  const paths = env.config.paths;
  const wasmCode = readWasmSync(paths.artifacts, contractName);

  return wasmCode;
}
