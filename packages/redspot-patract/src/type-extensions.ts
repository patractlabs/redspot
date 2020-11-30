import type { ApiPromise } from '@polkadot/api';
import type { Abi } from '@polkadot/api-contract';
import type { AccountId } from '@polkadot/types/interfaces/types';
import type BN from 'bn.js';
import { AccountSigner } from 'redspot/types/provider';
import 'redspot/types/runtime';
import type Contract from './contract';
import type ContractFactory from './contractFactory';

declare module 'redspot/types/runtime' {
  interface RuntimeEnvironment {
    patract: {
      api: ApiPromise;
      Contract: typeof Contract;
      ContractFactory: typeof ContractFactory;
      /**
       * Connect the node
       */
      connect: () => Promise<ApiPromise>;
      /**
       * Disconnect the node
       */
      disconnect: () => Promise<void>;
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
        signer?: AccountSigner
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
        signer?: AccountSigner
      ): Promise<ContractFactory>;
      /**
       * Returns the abi that matches the contract name
       *
       * @param contractName Contract name
       * @returns Abi
       */
      getAbi(contractName: string): Abi;
      /**
       * Returns the wasm that matches the contract name
       *
       * @param contractName
       * @returns Wasm
       */
      getWasm(contractName: string): string;
      /**
       * Generate the signer instance from user config
       *
       * @returns Signer of the array
       */
      getSigners: () => Promise<AccountSigner[]>;
      /**
       *  Generate a random account and transfer token to it
       *
       * @param from This account will be transferred to the new account
       * @param amount The amount transferred to the new account
       * @returns New Account
       */
      getRandomSigner(
        from?: AccountSigner,
        amount?: BN | number | string | BigInt
      ): Promise<AccountSigner>;
    };
  }
}
