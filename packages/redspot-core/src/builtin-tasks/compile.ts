import { task } from '../internal/core/config/config-env';
import {
  TASK_COMPILE,
  TASK_COMPILE_INK,
  TASK_COMPILE_SOLANG
} from './task-names';

task(TASK_COMPILE, 'Compiles the entire project, building all artifacts')
  .addOptionalVariadicPositionalParam(
    'compilePathPattern',
    'A glob string that is matched against',
    []
  )

  .setAction(
    async (
      {
        compilePathPattern
      }: {
        compilePathPattern: string[];
      },
      { config, run }
    ) => {
      await run(TASK_COMPILE_INK, { compilePathPattern });
      if (config.contract.solang) {
        await run(TASK_COMPILE_SOLANG, { compilePathPattern });
      }
    }
  );
