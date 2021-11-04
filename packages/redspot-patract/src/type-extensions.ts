import type { AccountId } from '@polkadot/types/interfaces/types';
import type BN from 'bn.js';
import type { Signer } from 'redspot/types';
import 'redspot/types/runtime';
import type Contract from './contract';
import type ContractFactory from './contractFactory';
import type { SignerOptions } from '@polkadot/api/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import type { Registry } from '@polkadot/types/types';
import type { TransactionResponse } from './types';

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
      /**
       *  Build a transaction
       *
       * @param registry The registry of types in polkadot api
       * @param extrinsic The extrinsic (tx) to be signed and sent
       * @param signer The account used to sign
       * @param options Signer options
       * @returns Promise<TransactionResponse>
       */
      buildTx(
        registry: Registry,
        extrinsic: SubmittableExtrinsic<'promise'>,
        signer: string,
        options?: Partial<SignerOptions>
      ): Promise<TransactionResponse>;
      
    };
  }
}
