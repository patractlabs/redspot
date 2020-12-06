import type { ApiPromise } from '@polkadot/api';
import type { Abi } from '@polkadot/api-contract';
import type { AccountId } from '@polkadot/types/interfaces/types';
import type BN from 'bn.js';
import 'redspot/types/runtime';
import type Contract from './contract';
import type ContractFactory from './contractFactory';
import type { Signer } from 'redspot/types';
import type { KeyringPair } from '@polkadot/keyring/types';

declare module 'redspot/types/runtime' {
  interface RuntimeEnvironment {
    patract: {
      Contract: typeof Contract;
      ContractFactory: typeof ContractFactory;
      /**
       * Generating Contract Instance from Contract Addresses
       *
       * @param contractName Contract name
       * @param address contract address
       * @param signer The account used to sign, or the first account in the user configured if it is undefined.
       * @returns Contract Instance
       */
      getContractAt(
        contractName: string,
        address: AccountId | string,
        signer?: Signer
      ): Promise<Contract>;
      /**
       * Return the contract factory
       *
       * @param contractName Contract name
       * @param signer The account used to sign, or the first account in the user configured if it is undefined.
       * @returns Contract Factory Instance
       */
      getContractFactory(
        contractName: string,
        signer?: Signer
      ): Promise<ContractFactory>;
      /**
       *  Generate a random account and transfer token to it
       *
       * @param from This account will be transferred to the new account
       * @param amount The amount transferred to the new account
       * @returns New Account
       */
      getRandomSigner(
        from?: Signer,
        amount?: BN | number | string | BigInt
      ): Promise<Signer>;
    };
  }
}
