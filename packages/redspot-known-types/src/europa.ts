import type { OverrideBundleDefinition } from '@polkadot/types/types';

const definitions: OverrideBundleDefinition = {
  types: [
    {
      minmax: [0, undefined],
      types: {
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
