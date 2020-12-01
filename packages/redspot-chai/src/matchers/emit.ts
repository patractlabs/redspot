import type Contract from '@redspot/patract/contract';
import { TransactionResponse } from '@redspot/patract/types';

export function supportEmit(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod('emit', function (
    this: any,
    contract: Contract,
    eventName: string
  ) {
    const promise = this._obj;
    const derivedPromise = promise.then((response: TransactionResponse) => {
      const abiEvent = contract.abi.project.spec.events.find(
        (x) => x.name.toString().toLowerCase() === eventName.toLowerCase()
      );

      if (abiEvent === undefined) {
        const isNegated = this.__flags.negate === true;
        this.assert(
          isNegated,
          `Expected event "${eventName}" to be emitted, but it doesn't` +
            " exist in the contract. Please make sure you've compiled" +
            ' its latest version before running the test.',
          `WARNING: Expected event "${eventName}" NOT to be emitted.` +
            " The event wasn't emitted because it doesn't" +
            " exist in the contract. Please make sure you've compiled" +
            ' its latest version before running the test.',
          eventName,
          ''
        );
        return;
      }

      this.logs = (response.events || []).filter(
        ({ name }) => name.toLowerCase() === eventName.toLowerCase()
      );

      this.assert(
        this.logs.length > 0,
        `Expected event "${eventName}" to be emitted, but it wasn't`,
        `Expected event "${eventName}" NOT to be emitted, but it was`
      );
    });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    this.contract = contract;
    this.eventName = eventName;
    return this;
  });

  const assertArgsArraysEqual = (
    context: any,
    expectedArgs: any[],
    log: any
  ) => {
    const actualArgs = log.args;

    context.assert(
      actualArgs.length === expectedArgs.length,
      `Expected "${context.eventName}" event to have ${expectedArgs.length} argument(s), ` +
        `but it has ${actualArgs.length}`,
      'Do not combine .not. with .withArgs()',
      expectedArgs.length,
      actualArgs.length
    );

    for (let index = 0; index < expectedArgs.length; index++) {
      if (
        expectedArgs[index].length !== undefined &&
        typeof expectedArgs[index] !== 'string'
      ) {
        for (let j = 0; j < expectedArgs[index].length; j++) {
          new Assertion(actualArgs[index][j]).equal(expectedArgs[index][j]);
        }
      } else {
        new Assertion(actualArgs[index]).equal(expectedArgs[index]);
      }
    }
  };

  const tryAssertArgsArraysEqual = (
    context: any,
    expectedArgs: any[],
    logs: any[]
  ) => {
    if (logs.length === 1)
      return assertArgsArraysEqual(context, expectedArgs, logs[0]);
    for (const index in logs) {
      try {
        assertArgsArraysEqual(context, expectedArgs, logs[index]);
        return;
      } catch {}
    }
    context.assert(
      false,
      `Specified args not emitted in any of ${context.logs.length} emitted "${context.eventName}" events`,
      'Do not combine .not. with .withArgs()'
    );
  };

  Assertion.addMethod('withArgs', function (this: any, ...expectedArgs: any[]) {
    const derivedPromise = this.promise.then(() => {
      tryAssertArgsArraysEqual(this, expectedArgs, this.logs);
    });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    return this;
  });
}
