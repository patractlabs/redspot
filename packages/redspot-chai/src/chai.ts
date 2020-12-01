import './types';
import { supportBn } from './matchers/bn';
import { supportEq } from './matchers/eq';
import { supportEmit } from './matchers/emit';
import { supportProperAddress } from './matchers/properAddress';
import { supportProperHex } from './matchers/properHex';
import { supportChangeBalance } from './matchers/changeBalance';
import { supportChangeTokenBalance } from './matchers/changeTokenBalance';
import { supportChangeTokenBalances } from './matchers/changeTokenBalances';

export function patractChai(chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
  supportBn(chai.Assertion, utils);
  supportEq(chai.Assertion, utils);
  supportEmit(chai.Assertion);
  supportProperAddress(chai.Assertion);
  supportProperHex(chai.Assertion);
  supportChangeBalance(chai.Assertion);
  supportChangeTokenBalance(chai.Assertion);
  supportChangeTokenBalances(chai.Assertion);
}
