import { task } from '../internal/core/config/config-env';
import {
  TASK_COMPILE,
  TASK_COMPILE_INK,
  TASK_COMPILE_SOLANG
} from './task-names';

task(
  TASK_COMPILE,
  'Compiles the entire project, building all artifacts'
).setAction(async ({ toolchain }: { toolchain?: string }, { config, run }) => {
  if (config.compiler?.compilerType === 'solang') {
    return run(TASK_COMPILE_SOLANG);
  }
  return run(TASK_COMPILE_INK);
});
