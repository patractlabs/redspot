import debug from 'debug';
import fsExtra from 'fs-extra';
import { task } from '../internal/core/config/config-env';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import { runScriptWithRedspot } from '../internal/util/scripts-runner';
import { TASK_COMPILE, TASK_RUN } from './task-names';

const log = debug('redspot:core:tasks:run');

task(TASK_RUN, 'Runs a user-defined script after compiling the project')
  .addPositionalParam(
    'script',
    "A js file to be run within redspot's environment"
  )
  .addFlag('noCompile', "Don't compile before running this task")
  .setAction(
    async (
      { noCompile, script }: { script: string; noCompile: boolean },
      { redspotArguments, run }
    ) => {
      if (!(await fsExtra.pathExists(script))) {
        throw new RedspotError(ERRORS.BUILTIN_TASKS.RUN_FILE_NOT_FOUND, {
          script
        });
      }

      if (!noCompile) {
        await run(TASK_COMPILE, { quiet: true });
      }

      log(
        `Running script ${script} in a subprocess so we can wait for it to complete`
      );

      try {
        const scriptArgs = process.argv.slice(process.argv.indexOf(script) + 1)
        process.exitCode = await runScriptWithRedspot(redspotArguments, script, scriptArgs);
      } catch (error) {
        throw new RedspotError(
          ERRORS.BUILTIN_TASKS.RUN_SCRIPT_ERROR,
          {
            script,
            error: error.message
          },
          error
        );
      }
    }
  );
