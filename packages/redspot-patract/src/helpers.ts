import { Abi } from '@polkadot/api-contract';
import type { AccountId } from '@polkadot/types/interfaces/types';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import type { RuntimeEnvironment, Signer } from 'redspot/types';
import { buildTx } from './buildTx';
import Contract from './contract';
import ContractFactory from './contractFactory';

export async function getRandomSigner(
  env: RuntimeEnvironment,
  from?: Signer,
  amount?: BN | number | string | BigInt
): Promise<Signer> {
  await env.network.api.isReady;
  const api = env.network.api;
  const mnemonic = mnemonicGenerate();
  const keyringPair = env.network.keyring.addFromMnemonic(mnemonic);
  const newAccount = env.network.createSigner(keyringPair);

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
  const api = env.network.api;
  const artifact = env.artifacts.readArtifactSync(contractName);
  const abi = getAbi(env, contractName);

  if (!signer) {
    const signers = await env.network.getSigners();
    signer = signers[0];
  }

  ContractFactory.encodeSalt = env.network.utils.encodeSalt;

  const factory = new ContractFactory(artifact.source.wasm, abi, api, signer);

  factory.gasLimit = env.network.gasLimit;

  return factory;
}

export async function getContractAt(
  env: RuntimeEnvironment,
  contractName: string,
  address: AccountId | string,
  signer?: Signer
) {
  const api = env.network.api;

  const abi = getAbi(env, contractName);

  if (!signer) {
    const signers = await env.network.getSigners();
    signer = signers[0];
  }

  const contract = new Contract(address, abi, api, signer);

  contract.gasLimit = env.network.gasLimit;

  return contract;
}

export function getAbi(env: RuntimeEnvironment, contractName: string) {
  const registry = env.network.registry;
  const artifact = env.artifacts.readArtifactSync(contractName);
  const abi = new Abi(
    artifact,
    registry.createType('ChainProperties', {
      tokenDecimals: env.network.registry.chainDecimals,
      ss58Format: env.network.registry.chainSS58,
      tokenSymbol: env.network.registry.chainTokens
    })
  );

  return abi;
}
