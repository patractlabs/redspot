import { Bytes } from '@polkadot/types';
import { compactAddLength, u8aToU8a } from '@polkadot/util';
import { randomAsU8a } from '@polkadot/util-crypto';
import { Signer } from '../types';

const EMPTY_SALT = new Uint8Array();

export async function encodeSalt(
  salt: Uint8Array | string | null = randomAsU8a(),
  signerAddress?: string
): Promise<Uint8Array> {
  return salt instanceof Bytes
    ? salt
    : salt && salt.length
    ? compactAddLength(u8aToU8a(salt))
    : EMPTY_SALT;
}
