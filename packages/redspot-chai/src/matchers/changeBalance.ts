import BN from 'bn.js';
import { bnToBn } from '@polkadot/util';
import { Account, getAddressOf } from './misc/account';
import { BalanceChangeOptions, getBalance } from './misc/balance';
import { TransactionResponse } from '@redspot/patract/types';

export function supportChangeBalance(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod('changeBalance', function (
    this: any,
    account: Account,
    balanceChange: BN | string | number | BigInt,
    options: BalanceChangeOptions
  ) {
    const subject = this._obj;
    const derivedPromise = Promise.all([
      getBalanceChange(subject, account, options),
      getAddressOf(account)
    ]).then(([actualChange, address]) => {
      this.assert(
        actualChange.eq(bnToBn(balanceChange)),
        `Expected "${address}" to change balance by ${balanceChange} wei, ` +
          `but it has changed by ${actualChange} wei`,
        `Expected "${address}" to not change balance by ${balanceChange} wei,`,
        balanceChange,
        actualChange
      );
    });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    return this;
  });
}

export async function getBalanceChange(
  transaction:
    | TransactionResponse
    | (() => Promise<TransactionResponse> | TransactionResponse),
  account: Account,
  options?: BalanceChangeOptions
) {
  if (!account.api) {
    throw new TypeError('Api not found');
  }

  let txResponse: TransactionResponse;

  if (typeof transaction === 'function') {
    txResponse = await transaction();
  } else {
    txResponse = transaction;
  }

  const txBlockHash = txResponse.blockHash;

  const header = await account.api.rpc.chain.getHeader(txBlockHash);

  const txBlockNumber = header.number.toBn();

  const balanceAfter = await getBalance(account, txBlockNumber);
  const balanceBefore = await getBalance(account, txBlockNumber.subn(1));

  if (
    options?.includeFee !== true &&
    (await getAddressOf(account)) === txResponse.from
  ) {
    const txFee = txResponse.result.dispatchInfo.weight;
    console.log(balanceAfter.add(txFee).sub(balanceBefore));

    return balanceAfter.add(txFee).sub(balanceBefore);
  } else {
    return balanceAfter.sub(balanceBefore);
  }
}
