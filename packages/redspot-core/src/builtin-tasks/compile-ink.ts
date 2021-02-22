import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { checkEnv } from '../compiler/ink/checkEnv';
import { compile, InkOutput } from '../compiler/ink/compile';
import { getCompilerInput, InkInput } from '../compiler/ink/compilerInput';
import { subtask } from '../internal/core/config/config-env';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import {
  TASK_COMPILE_INK,
  TASK_COMPILE_INK_EXEC,
  TASK_COMPILE_INK_INPUT,
  TASK_COMPILE_INK_OUTPUT,
  TASK_COMPILE_INK_PRE
} from './task-names';

subtask(TASK_COMPILE_INK_PRE, async (_, { config }) => {
  const isValidEnv = await checkEnv({ version: '0.8.0' });

  if (!isValidEnv) {
    throw new RedspotError(ERRORS.BUILTIN_TASKS.INK_ENV_ERROR, {
      version: 'v0.8.0'
    });
  }
});

subtask(TASK_COMPILE_INK_INPUT, async (_, { config }) => {
  const input = await getCompilerInput(config.contract.ink);

  return input;
});

subtask(
  TASK_COMPILE_INK_EXEC,
  async ({ input }: { input: InkInput }, { redspotArguments }) => {
    const output = await compile(input, redspotArguments.verbose);

    return output;
  }
);

subtask(
  TASK_COMPILE_INK_OUTPUT,
  async ({ output }: { output: InkOutput[] }, { config, artifacts }) => {
    for (const target of output) {
      const abiJSON = fs.readJSONSync(target.contract);
      delete abiJSON.source.wasm;
      fs.ensureDirSync(config.paths.artifacts);
      fs.writeJSONSync(
        path.resolve(config.paths.artifacts, `${target.name}.json`),
        abiJSON,
        { spaces: 2 }
      );
      artifacts.copyToArtifactDir([target.wasm, target.contract]);
    }
    console.log('');
    console.log(
      `🎉  Compile successfully! You can find all artifacts at ${chalk.cyan(
        config.paths.artifacts
      )}`
    );
  }
);

subtask(TASK_COMPILE_INK, async (_, { run }) => {
  await run(TASK_COMPILE_INK_PRE);

  const input = await run(TASK_COMPILE_INK_INPUT);
  const output = await run(TASK_COMPILE_INK_EXEC, { input });
  await run(TASK_COMPILE_INK_OUTPUT, { output });
});
