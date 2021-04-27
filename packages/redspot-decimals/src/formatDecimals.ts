import { AnyNumber } from '@polkadot/types/types';
import { isString, BN_TEN } from '@polkadot/util';
import BN from 'bn.js';
const units: string[] = [
  'DOT', // 1 -> 10**10
  'KSM', // 1 -> 10**12
  'UNIT' // 1 -> 10**tokenDecimal
];

// eslint-disable-next-line prefer-regex-literals
const regexp = new RegExp(`^(\\d+(\\.\\d+)*)\\s(${units.join('|')})$`, 'i');

export function formatDecimals(value: AnyNumber, decimals?: number): AnyNumber {
  if (isString(value) && regexp.test(value)) {
    const [, num, , unit] = value.match(regexp);

    switch (unit.toUpperCase()) {
      case 'DOT':
        decimals = 10;
        break;

      case 'KSM':
        decimals = 12;
        break;

      default:
        break;
    }

    const [pre, suf] = num.split('.');
    const preBn = new BN(pre || 0);
    let sufBn: BN;
    if (!suf) {
      sufBn = new BN(0);
    } else if (suf.length > decimals) {
      sufBn = new BN(suf.slice(0, decimals));
    } else {
      sufBn = new BN(suf).mul(BN_TEN.pow(new BN(decimals - suf.length)));
    }

    return preBn.mul(BN_TEN.pow(new BN(decimals))).add(sufBn);
  }

  return value;
}
