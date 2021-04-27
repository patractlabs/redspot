import chai, { expect } from 'chai';
import { formatDecimals } from './formatDecimals';
import BN from 'bn.js';
import { BN_TEN } from '@polkadot/util';
import { patractChai } from '@redspot/chai/chai';

chai.use(patractChai);

describe('formatDecimals test', (): void => {
  it('`1 DOT` value test', (): void => {
    const value = formatDecimals('1 DOT', 10);
    expect(value).eq(BN_TEN.pow(new BN(10)));
  });

  it('`1 UNIT` value test', (): void => {
    const value = formatDecimals('1 UNIT', 10);
    expect(value).eq(new BN(1));
  });

  it('String value test', (): void => {
    const value = formatDecimals('10', 10);
    expect(value).eq('10');
  });

  it('BN value test', (): void => {
    const value = formatDecimals('10', 10);
    expect(value).eq('10');
  });

  it('Number value test', (): void => {
    const value = formatDecimals(123, 10);
    expect(value).eq(123);
  });
});
