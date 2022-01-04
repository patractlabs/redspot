import { UIntBitLength } from '@polkadot/types/codec/types';
import { AbstractInt } from '@polkadot/types-codec';
import { Registry, AnyNumber, Constructor } from '@polkadot/types/types';
import { formatDecimals } from './formatDecimals';

export class CustomWeight extends AbstractInt {
  public static with(
    decimals: number,
    bitLength: UIntBitLength,
    typeName?: string
  ): Constructor<CustomWeight> {
    return class extends CustomWeight {
      constructor(registry: Registry, value?: AnyNumber) {
        super(registry, formatDecimals(value, decimals), bitLength);
      }

      public toRawType(): string {
        return typeName || super.toRawType();
      }
    };
  }
}
