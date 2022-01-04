import { UIntBitLength } from '@polkadot/types/codec/types';
import { DEFAULT_UINT_BITS } from '@polkadot/types-codec/abstract/AbstractInt';

const regexp1 = /^u(8|16|32|64|128|256)$/i;
const regexp2 = /^UInt<(8|16|32|64|128|256)/i;

export const getTypeLength = (type?: string): UIntBitLength => {
  if (!type) {
    return DEFAULT_UINT_BITS;
  }

  if (regexp1.test(type)) {
    const [, typeLength] = type.match(regexp1);
    return parseInt(typeLength) as UIntBitLength;
  } else if (regexp2.test(type)) {
    const [, typeLength] = type.match(regexp2);
    return parseInt(typeLength) as UIntBitLength;
  }

  return DEFAULT_UINT_BITS;
};
