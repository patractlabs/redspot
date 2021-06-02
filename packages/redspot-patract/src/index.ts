import { extendEnvironment } from 'redspot/config';
import { lazyObject } from 'redspot/plugins';
import Contract from './contract';
import ContractFactory from './contractFactory';
import { getContractAt, getContractFactory, getRandomSigner } from './helpers';
import './type-extensions';

extendEnvironment((env) => {
  env.patract = lazyObject(() => {
    return {
      Contract: Contract as any,
      ContractFactory: ContractFactory as any,
      getContractFactory: getContractFactory.bind(null, env),
      getContractAt: getContractAt.bind(null, env),
      getRandomSigner: getRandomSigner.bind(null, env)
    };
  });
});
