import { base58Decode, checkAddressChecksum } from '@polkadot/util-crypto';

export function supportProperAddress(Assertion: Chai.AssertionStatic) {
  Assertion.addProperty('properAddress', function (this: any) {
    const subject = this._obj;

    let isValid = false;

    try {
      const decoded = base58Decode(subject);
      [isValid] = checkAddressChecksum(decoded);
    } catch {}

    this.assert(
      isValid,
      `Expected "${subject}" to be a proper address`,
      `Expected "${subject}" not to be a proper address`,
      'proper address (eg.: 5DbunfSdkaQLsR4kz8NxTtWszCA5pcji1vjnXB2cga14d35Y)',
      subject
    );
  });
}
