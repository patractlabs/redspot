import type { OverrideBundleDefinition } from '@polkadot/types/types';

const definitions: OverrideBundleDefinition = {
  rpc: {
    europa: {
      forwardToHeight: {
        description: '',
        params: [
          {
            name: 'height',
            type: 'u32'
          }
        ],
        type: 'Bytes'
      },
      backwardToHeight: {
        description: '',
        params: [
          {
            name: 'height',
            type: 'u32'
          }
        ],
        type: 'Bytes'
      }
    }
  },
  types: [
    {
      minmax: [0, undefined],
      types: {
        LookupSource: 'MultiAddress',
        Address: 'MultiAddress',
        AliveContractInfo: {
          trieId: 'TrieId',
          storageSize: 'u32',
          pairCount: 'u32',
          codeHash: 'CodeHash',
          rentAllowance: 'Balance',
          rentPayed: 'Balance',
          deductBlock: 'BlockNumber',
          lastWrite: 'Option<BlockNumber>',
          _reserved: 'Option<Null>'
        }
      }
    }
  ]
};

export default definitions;
