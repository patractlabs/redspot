import { task } from '../internal/core/config/config-env';
import {
  TASK_COMPILE,
  TASK_COMPILE_INK,
  TASK_COMPILE_SOLANG
} from './task-names';

task(
  TASK_COMPILE,
  'Compiles the entire project, building all artifacts'
).setAction(async (_, { config, run }) => {
  // await run(TASK_COMPILE_INK);
  await run(TASK_COMPILE_SOLANG);
});
