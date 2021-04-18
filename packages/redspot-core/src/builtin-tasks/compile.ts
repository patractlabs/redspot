import { task } from '../internal/core/config/config-env';
import { boolean } from '../internal/core/params/argumentTypes';
import {
  TASK_COMPILE,
  TASK_COMPILE_INK,
  TASK_COMPILE_SOLANG
} from './task-names';

task(TASK_COMPILE, 'Compiles the entire project, building all artifacts')
  .addOptionalParam('docker', 'Compiling with docker', undefined, boolean)
  .addOptionalVariadicPositionalParam(
    'sourcePattern',
    'A glob string that is matched against',
    []
  )

  .setAction(
    async (
      {
        docker,
        sourcePattern
      }: {
        docker?: boolean;
        sourcePattern: string[];
      },
      { config, run }
    ) => {
      await run(TASK_COMPILE_INK, { docker, sourcePattern });
      if (config.contract.solang) {
        await run(TASK_COMPILE_SOLANG, { sourcePattern });
      }
    }
  );
