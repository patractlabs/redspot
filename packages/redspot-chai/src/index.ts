import { extendEnvironment } from 'redspot/config';
import { lazyObject } from 'redspot/plugins';
import { init } from './init';

extendEnvironment((rse) => {
  init(rse.config.paths.root);
});
