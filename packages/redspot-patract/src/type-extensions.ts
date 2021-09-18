import type { AccountId } from '@polkadot/types/interfaces/types';
import type BN from 'bn.js';
import type { Signer } from 'redspot/types';
import 'redspot/types/runtime';
import type Contract from './contract';
import type ContractFactory from './contractFactory';

declare module 'redspot/types/runtime' {
  interface RuntimeEnvironment {
    patract: {
      Contract: Contract;
      ContractFactory: ContractFactory;
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
        signer?: Signer | string
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
        signer?: Signer | string
      ): Promise<ContractFactory>;
      /**
       *  Generate a random account and transfer token to it
       *
       * @param from This account will be transferred to the new account
       * @param amount The amount transferred to the new account
       * @returns New Account
       */
      getRandomSigner(
        from?: Signer | string,
        amount?: BN | number | string | bigint
      ): Promise<Signer>;
    };
  }
}
