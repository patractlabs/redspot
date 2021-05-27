import type { OverrideBundleDefinition } from '@polkadot/types/types';

const definitions: OverrideBundleDefinition = {
  types: [
    {
      minmax: [0, 8],
      types: {
        Address: 'AccountId',
        LookupSource: 'AccountId',
        Schedule: 'ScheduleTo258'
      }
    },
    {
      minmax: [9, undefined],
      types: {
        Address: 'MultiAddress',
        LookupSource: 'MultiAddress'
      }
    }
  ]
};

export default definitions;
