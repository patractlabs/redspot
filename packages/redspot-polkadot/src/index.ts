import { extendEnvironment } from 'redspot/config';
import { lazyObject } from 'redspot/plugins';
import Api from './api';

export default function () {
  extendEnvironment((env) => {
    env.polkadot = lazyObject(() => {
      const network = env.network;
      const provider = network.provider;
      const registry = network.provider.registry;

      return new Api(
        {
          provider,
          registry
        },
        network,
        env.artifacts
      );
    });
  });
}
