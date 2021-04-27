import { extendEnvironment } from 'redspot/config';
import { CustomBalance } from './balance';
import { CustomWeight } from './weight';

extendEnvironment((env) => {
  const api = env.network.api;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  api.isReadyOrError
    .then(() => api.rpc.system.properties())
    .then((properties) => {
      const decimals = properties.tokenDecimals
        .unwrapOr([api.registry.createType('u32', 12)])[0]
        .toNumber();

      api.registerTypes({
        Weight: CustomWeight.with(decimals),
        Balance: CustomBalance.with(decimals)
      });
    });
});
