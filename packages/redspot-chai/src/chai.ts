import './types';
import { supportBn } from './matchers/bn';
import { supportEq } from './matchers/eq';
// import {supportReverted} from './matchers/reverted';
// import {supportRevertedWith} from './matchers/revertedWith';
// import {supportEmit} from './matchers/emit';
import { supportProperAddress } from './matchers/properAddress';
import { supportProperHex } from './matchers/properHex';
import { supportChangeBalance } from './matchers/changeBalance';
// import {supportChangeBalances} from './matchers/changeBalances';

// import {supportChangeTokenBalance} from './matchers/changeTokenBalance';
// import {supportChangeTokenBalances} from './matchers/changeTokenBalances';
// import {supportCalledOnContract} from './matchers/calledOnContract/calledOnContract';
// import {supportCalledOnContractWith} from './matchers/calledOnContract/calledOnContractWith';

export function patractChai(chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
  supportBn(chai.Assertion, utils);
  supportEq(chai.Assertion, utils);
  // supportReverted(chai.Assertion);
  // supportRevertedWith(chai.Assertion);
  // supportEmit(chai.Assertion);
  supportProperAddress(chai.Assertion);
  supportProperHex(chai.Assertion);
  supportChangeBalance(chai.Assertion);
  // supportChangeBalances(chai.Assertion);
  // supportChangeEtherBalance(chai.Assertion);
  // supportChangeEtherBalances(chai.Assertion);
  // supportChangeTokenBalance(chai.Assertion);
  // supportChangeTokenBalances(chai.Assertion);
  // supportCalledOnContract(chai.Assertion);
  // supportCalledOnContractWith(chai.Assertion);
}
