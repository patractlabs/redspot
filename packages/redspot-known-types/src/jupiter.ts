import type { OverrideBundleDefinition } from '@polkadot/types/types';

const definitions: OverrideBundleDefinition = {
  types: [
    {
      minmax: [0, undefined],
      types: {
        LookupSource: 'MultiAddress',
        Address: 'MultiAddress',
        FullIdentification: 'AccountId',
        AuthorityState: {
          _enum: ['Working', 'Waiting']
        },
        EraIndex: 'u32',
        ActiveEraInfo: {
          index: 'EraIndex',
          start: 'Option<u64>'
        },
        UnappliedSlash: {
          validator: 'AccountId',
          reporters: 'Vec<AccountId>'
        },
        AccountInfo: 'AccountInfoWithProviders',
        AliveContractInfo: {
          trieId: 'TrieId',
          storageSize: 'u32',
          pairCount: 'u32',
          codeHash: 'CodeHash',
          rentAllowance: 'Balance',
          deductBlock: 'BlockNumber',
          lastWrite: 'Option<BlockNumber>',
          _reserved: 'Option<Null>'
        }
      }
    }
  ]
};

export default definitions;
