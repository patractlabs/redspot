import { isHex } from '@polkadot/util';

export function supportProperHex(Assertion: Chai.AssertionStatic) {
  Assertion.addProperty('properHex', function (this: any) {
    const subject = this._obj;
    this.assert(
      isHex(subject),
      `Expected "${subject}" to be a proper hex`,
      `Expected "${subject}" not to be a proper hex`,
      'proper hex (eg.: 0x1234567890123456789012345678901234567890)',
      subject
    );
  });
}
