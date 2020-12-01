import { extendEnvironment } from 'redspot/config';
import { init } from './init';
import './types';

extendEnvironment((rse) => {
  init(rse.config.paths.root);
});
