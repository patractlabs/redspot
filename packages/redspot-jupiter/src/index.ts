import { Bytes } from '@polkadot/types';
import { compactAddLength, numberToU8a } from '@polkadot/util';
import { extendEnvironment } from 'redspot/config';

import { Signer } from 'redspot/types';

extendEnvironment((env) => {
  const _encodedSalt = env.network.utils.encodeSalt;

  env.network.utils.encodeSalt = async function encodeSalt(
    salt?: string | Uint8Array | null,
    signerAddress?: string
  ): Promise<Uint8Array> {
    if (!signerAddress) throw new Error('Need Signer');

    const runtimeVersion = env.network.api.runtimeVersion;

    const isJupiter = runtimeVersion.specName
      .toString()
      .toLowerCase()
      .includes('jupiter');

    if (!isJupiter) return _encodedSalt(salt, signerAddress);

    const nonceCodec = await env.network.api.query.system.accountNonce(signerAddress);

    const nonce = nonceCodec.toHuman()['nonce']

    return salt instanceof Bytes ? salt : compactAddLength(numberToU8a(nonce));
  };
});
