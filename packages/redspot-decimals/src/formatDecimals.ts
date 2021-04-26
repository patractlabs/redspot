import { AnyNumber } from '@polkadot/types/types';
import { isString, BN_TEN } from '@polkadot/util';
import BN from 'bn.js';
const units: string[] = [
  'DOT', // 1 -> 1**decimals
  'UNIT' // 1 -> 1
];

// eslint-disable-next-line prefer-regex-literals
const regexp = new RegExp(`^(\\d+(\\.\\d+)*)\\s(${units.join('|')})$`, 'i');

export function formatDecimals(value: AnyNumber, decimals: number): AnyNumber {
  console.log(value, decimals);
  if (isString(value) && regexp.test(value)) {
    const [, num, , unit] = value.match(regexp);

    if (unit.toUpperCase() === 'DOT') {
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
      console.log(
        preBn
          .mul(BN_TEN.pow(new BN(decimals)))
          .add(sufBn)
          .toString()
      );
      return preBn.mul(BN_TEN.pow(new BN(decimals))).add(sufBn);
    } else if (unit.toUpperCase() === 'UNIT') {
      const [pre] = num.split('.');
      return pre;
    }
  }

  return value;
}
