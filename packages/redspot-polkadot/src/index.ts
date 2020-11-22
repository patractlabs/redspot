import { extendEnvironment } from 'redspot/config';
import { lazyObject } from 'redspot/plugins';
import type { RedspotRuntimeEnvironment } from 'redspot/types';
import Api from './api';

export default function () {
  extendEnvironment((env: RedspotRuntimeEnvironment) => {
    // @ts-ignore
    env.polkadot = lazyObject(() => {
      const paths = env.config.paths;
      const network = env.network;
      const provider = network.provider;
      const registry = network.provider.registry;

      return new Api(
        {
          provider,
          registry
        },
        network,
        paths
      );
    });
  });
}
