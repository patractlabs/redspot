import { getSpecTypes } from '@polkadot/types-known';
import { extendEnvironment } from 'redspot/config';
import { edgeware, plasm, clover, cloverRococo } from './chain';
import { jupiterRococo } from './jupiter-rococo';

import europaDef from './europa';
import jupiterDef from './jupiter';
import canvasDef from './canvas';

extendEnvironment((env) => {
  const api = env.network.api;
  const registry = api.registry;
  const network = env.network;

  const knownTypes = {
    typesBundle: {
      spec: {
        canvas: canvasDef,
        jupiter: jupiterDef,
        'jupiter-prep': jupiterDef,
        'jupiter-dev': jupiterDef,
        'jupiter-rococo': jupiterRococo,
        europa: europaDef,
        edgeware,
        plasm,
        clover,
        'clover-rococo': cloverRococo
      }
    }
  };

  api.once('ready', () => {
    const types = getSpecTypes(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      {
        knownTypes
      },
      api.runtimeChain,
      api.runtimeVersion.specName,
      api.runtimeVersion.specVersion
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    registry.register(types);

    const customTypes = getSpecTypes(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      {
        knownTypes: network.config
      },
      api.runtimeChain,
      api.runtimeVersion.specName,
      api.runtimeVersion.specVersion
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    registry.register(customTypes);
  });
});
