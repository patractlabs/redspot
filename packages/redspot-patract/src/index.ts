import { extendEnvironment } from "redspot/config";
import { lazyObject } from "redspot/plugins";
import type { RedspotRuntimeEnvironment } from "redspot/types";
import getSigners from "./getSigners";

export default function () {
  extendEnvironment((env: RedspotRuntimeEnvironment) => {
    // @ts-ignore
    env.patract = lazyObject(() => {
      const paths = env.config.paths;
      const network = env.network;
      const provider = network.provider;
      const registry = network.provider.registry;

      return {
        getSigners: async () => getSigners(env),
      };
    });
  });
}
