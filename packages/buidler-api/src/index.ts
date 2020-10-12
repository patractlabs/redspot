import { extendEnvironment } from "@redspot/buidler/config";
import { lazyObject } from "@redspot/buidler/plugins";
import { BuidlerRuntimeEnvironment } from "@redspot/buidler/types";
import { ApiPromise } from "@polkadot/api";
import Api from "./api";

export default function () {
  extendEnvironment((env: BuidlerRuntimeEnvironment) => {
    env.api = lazyObject(() => {
      const paths = env.config.paths;
      const network = env.network;
      const provider = network.provider;
      const types = network.provider.types;

      return new Api(
        {
          provider,
          types,
        },
        network,
        paths
      );
    });
  });
}
