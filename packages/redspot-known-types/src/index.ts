import { typesBundle, typesChain } from '@polkadot/apps-config/api';
import { extendEnvironment } from 'redspot/config';
import { getSpecAlias } from '@polkadot/types-known';

extendEnvironment((env) => {
  env.network.api.registry.setKnownTypes({
    types: env.network.config.types,
    typesAlias: env.network.config.typesAlias,
    typesBundle: {
      chain: {
        ...env.network.config.typesBundle?.chain,
        ...typesBundle.chain
      },
      spec: {
        ...env.network.config.typesBundle?.spec,
        ...typesBundle.spec
      }
    },
    typesChain: {
      ...env.network.config.typesChain,
      ...typesChain
    }
  });

  if (env.network.api.registry.knownTypes.typesBundle) {
    env.network.api.once('ready', () => {
      env.network.api.registry.knownTypes.typesAlias = getSpecAlias(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        env.network.api.registry,
        env.network.api.runtimeChain,
        env.network.api.runtimeVersion.specName
      );
    });
  }

  console.log(env.network.api.registry.knownTypes);
});
