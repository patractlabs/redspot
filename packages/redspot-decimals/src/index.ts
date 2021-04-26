import { extendEnvironment } from 'redspot/config';
import { CustomWeight } from './weight';

extendEnvironment((env) => {
  const api = env.network.api;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  api.isReadyOrError
    .then(() => api.rpc.system.properties())
    .then((properties) => {
      console.log(properties.tokenDecimals.toHuman());
      api.registerTypes({
        Weight: CustomWeight.with(
          properties.tokenDecimals
            .unwrapOr([api.registry.createType('u32', 12)])[0]
            .toNumber()
        )
      });
    });
});
