import { AnyNumber } from '@polkadot/types/types';
import { isString, BN_TEN } from '@polkadot/util';
import BN from 'bn.js';
const units: string[] = [
  'DOT', // 1 -> 10**10
  'KSM', // 1 -> 10**12
  'UNIT' // 1 -> 10**tokenDecimal
];

const regexp = new RegExp(`^(\\d+(\\.\\d+)*)\\s(${units.join('|')})$`, 'i');

export function formatDecimals(value: AnyNumber, decimals?: number): AnyNumber {
  if (isString(value) && regexp.test(value)) {
    const [, num, , unit] = value.match(regexp);

    let _decimals: number | null = null;

    switch (unit.toUpperCase()) {
      case 'DOT':
        _decimals = 10;
        break;

      case 'KSM':
        _decimals = 12;
        break;

      case 'UNIT':
        if (!decimals || decimals < 1) {
          throw new Error(
            "Can't use UNIT when has not decimals or decimals is zero"
          );
        } else {
          _decimals = decimals;
        }
        break;

      default:
        throw new Error(`Unknown unit ${unit}`);
    }

    const [pre, suf] = num.split('.');
    const preBn = new BN(pre || 0);
    let sufBn: BN;
    if (!suf) {
      sufBn = new BN(0);
    } else if (suf.length > _decimals) {
      sufBn = new BN(suf.slice(0, _decimals));
    } else {
      sufBn = new BN(suf).mul(BN_TEN.pow(new BN(_decimals - suf.length)));
    }

    return preBn.mul(BN_TEN.pow(new BN(_decimals))).add(sufBn);
  }

  return value;
}
