import { extendEnvironment } from "@redspot/buidler/config";
import { lazyObject } from "@redspot/buidler/plugins";
import { BuidlerRuntimeEnvironment } from "@redspot/buidler/types";
import { ApiPromise } from "@polkadot/api";
import Api from "./api";

export default function () {
  extendEnvironment((env: BuidlerRuntimeEnvironment) => {
    env.api = lazyObject(() => {
      const provider = env.network.provider;
      const types = env.network.provider.types;

      return new Api(
        {
          provider,
          types,
        },
        env
      );

      // // const { ethers } = require("ethers") as typeof EthersT;

      // return {
      //   ...ethers,

      //   // The provider wrapper should be removed once this is released
      //   // https://github.com/nomiclabs/buidler/pull/608
      //   provider: new EthersProviderWrapper(env.network.provider),
      //   getKeypairs: async () => getKeypairs(env),
      //   getContractFactory: getContractFactory.bind(null, env) as any,
      //   getContractAt: getContractAt.bind(null, env),
      // };
    });
  });
}
