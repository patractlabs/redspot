import { extendEnvironment } from "redspot/config";
import { lazyObject } from "redspot/plugins";
import { BuidlerRuntimeEnvironment } from "redspot/types";
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
