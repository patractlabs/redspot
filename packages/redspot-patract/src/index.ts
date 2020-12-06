import { ApiPromise } from '@polkadot/api';
import { extendEnvironment } from 'redspot/config';
import { lazyObject } from 'redspot/plugins';
import Contract from './contract';
import ContractFactory from './contractFactory';
import {
  getAbi,
  getContractAt,
  getContractFactory,
  getRandomSigner
} from './helpers';
import './type-extensions';

extendEnvironment((env) => {
  env.patract = lazyObject(() => {
    const network = env.network;
    const api = network.api;

    return {
      Contract: Contract,
      ContractFactory: ContractFactory,
      getContractFactory: getContractFactory.bind(null, env),
      getContractAt: getContractAt.bind(null, env),
      getRandomSigner: getRandomSigner.bind(null, env)
    };
  });
});
