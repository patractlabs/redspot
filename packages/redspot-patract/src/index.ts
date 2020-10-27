import { ApiPromise } from "@polkadot/api";
import { extendEnvironment } from "redspot/config";
import { lazyObject } from "redspot/plugins";
import type { RedspotRuntimeEnvironment } from "redspot/types";
import Contract from "./contract";
import ContractFactory from "./contractFactory";
import {
  getAbi,
  getContractAt,
  getContractFactory,
  getSigners,
  getWasm,
} from "./helpers";
import "./type-extensions";

export default function () {
  extendEnvironment((env: RedspotRuntimeEnvironment) => {
    env.patract = lazyObject(() => {
      const network = env.network;
      const provider = network.provider;
      const registry = network.provider.registry;

      const api = new ApiPromise({
        provider,
        registry,
        // hack
        ...registry.knownTypes,
      });

      api.connect();

      return {
        api: api,
        Contract: Contract,
        ContractFactory: ContractFactory,
        getContractFactory: getContractFactory.bind(null, env),
        getContractAt: getContractAt.bind(null, env),
        getAbi: getAbi.bind(null, env),
        getWasm: getWasm.bind(null, env),
        getSigners: async () => getSigners(env),
      };
    });
  });
}
