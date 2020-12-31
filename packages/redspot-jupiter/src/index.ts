import { Bytes } from '@polkadot/types';
import { compactAddLength, numberToU8a } from '@polkadot/util';
import { extendEnvironment } from 'redspot/config';

import { Signer } from 'redspot/types';

extendEnvironment((env) => {
  const _encodedSalt = env.network.utils.encodeSalt;

  env.network.utils.encodeSalt = async function encodeSalt(
    salt?: string | Uint8Array | null,
    signer?: Signer
  ): Promise<Uint8Array> {
    if (!signer) throw new Error('Need Signer');

    const accountInfo = await signer.api.query.system.account(signer.address);

    const runtimeVersion = signer.api.runtimeVersion;

    const isJupiter = runtimeVersion.specName
      .toString()
      .toLowerCase()
      .includes('jupiter');

    if (!isJupiter) return _encodedSalt(salt, signer);

    const nonce = accountInfo.nonce.toNumber();

    return salt instanceof Bytes ? salt : compactAddLength(numberToU8a(nonce));
  };
});
