import { Abi } from '@polkadot/api-contract';
import type { AccountId } from '@polkadot/types/interfaces/types';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import BN from 'bn.js';
import chalk from 'chalk';
import log from 'redspot/logger';
import type {
  RuntimeEnvironment,
  Signer,
  LocalKeyringPair
} from 'redspot/types';
import { buildTx } from './buildTx';
import Contract from './contract';
import ContractFactory from './contractFactory';

export function converSignerToAddress(signer?: Signer | string): string {
  if (!signer) return '';
  return typeof signer !== 'string' ? signer.address : signer;
}

export async function getRandomSigner(
  env: RuntimeEnvironment,
  from?: Signer | string,
  amount?: BN | number | string | bigint
): Promise<Signer> {
  await env.network.api.isReady;
  const api = env.network.api;
  const mnemonic = mnemonicGenerate();
  const keyringPair = env.network.keyring.addFromUri(mnemonic);
  (keyringPair as LocalKeyringPair).suri = mnemonic;

  const newAccount = env.network.createSigner(keyringPair);

  log.info(`Generate random signer: ${chalk.cyan(keyringPair.address)}`);
  log.info(`Mnemonic: ${chalk.cyan(mnemonic)}`);

  const fromAddress = converSignerToAddress(from);

  if (fromAddress && amount) {
    try {
      await buildTx(
        api.registry,
        api.tx.balances.transfer(keyringPair.address, amount),
        fromAddress
      );
    } catch (error) {
      log.error(`Transfer failed`);
      log.error(error.error);
      throw error;
    }

    log.info(
      `Transfer ${chalk.yellow(amount.toString())} from ${chalk.cyan(
        fromAddress
      )} to ${chalk.cyan(keyringPair.address)}`
    );

    return newAccount;
  }

  return newAccount;
}

export async function getContractFactory(
  env: RuntimeEnvironment,
  contractName: string,
  signer?: Signer | string
) {
  const api = env.network.api;
  const artifact = env.artifacts.readArtifactSync(contractName);
  const abi = getAbi(env, contractName);

  if (!signer) {
    const signers = await env.network.getSigners();
    signer = signers[0].address;
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
  signer?: Signer | string
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
      // @ts-ignore
    registry.createType('ChainProperties', {
      tokenDecimals: env.network.registry.chainDecimals,
      ss58Format: env.network.registry.chainSS58,
      tokenSymbol: env.network.registry.chainTokens
    })
  );

  return abi;
}
