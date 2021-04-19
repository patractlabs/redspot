import { typesBundle, typesChain } from '@polkadot/apps-config/api';
import { extendEnvironment } from 'redspot/config';
import { getSpecAlias } from '@polkadot/types-known';

extendEnvironment((env) => {
  console.log(env.network.api.registry.knownTypes);

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

  // console.log(typesBundle)

  if (env.network.api.registry.knownTypes.typesBundle) {
    env.network.api.once('ready', () => {
      env.network.api.registry.knownTypes.typesAlias = getSpecAlias(
        // @ts-ignore
        env.network.api.registry,
        env.network.api.runtimeChain,
        env.network.api.runtimeVersion.specName
      );
    });
  }

  console.log(env.network.api.registry.knownTypes);
});
