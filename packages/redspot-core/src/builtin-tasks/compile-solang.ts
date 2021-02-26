import chalk from 'chalk';
import { checkEnv } from '../compiler/ink/checkEnv';
import { compile, SolangOutput } from '../compiler/solang/compile';
import {
  getCompilerInput,
  SolangInput
} from '../compiler/solang/compilerInput';
import { subtask } from '../internal/core/config/config-env';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import {
  TASK_COMPILE_SOLANG,
  TASK_COMPILE_SOLANG_EXEC,
  TASK_COMPILE_SOLANG_INPUT,
  TASK_COMPILE_SOLANG_OUTPUT,
  TASK_COMPILE_SOLANG_PRE
} from './task-names';
import fs from 'fs-extra';
import path from 'path';

subtask(TASK_COMPILE_SOLANG_PRE, async (_, { config }) => {
  const isValidEnv = await checkEnv({ version: '0.9.1' });

  if (!isValidEnv) {
    throw new RedspotError(ERRORS.BUILTIN_TASKS.SOLANG_ENV_ERROR);
  }
});

subtask(TASK_COMPILE_SOLANG_INPUT)
  .addOptionalVariadicPositionalParam(
    'sourcePattern',
    'A glob string that is matched against',
    []
  )
  .setAction(
    async (
      {
        sourcePattern
      }: {
        sourcePattern: string[];
      },
      { config }
    ) => {
      const input = await getCompilerInput(
        config.contract.solang,
        sourcePattern
      );

      return input;
    }
  );

subtask(
  TASK_COMPILE_SOLANG_EXEC,
  async ({ input }: { input: SolangInput }, { config, redspotArguments }) => {
    if (!input.sources.length) return;

    const output = await compile(input, config.paths.artifacts);

    return output;
  }
);

subtask(
  TASK_COMPILE_SOLANG_OUTPUT,
  async (
    { input, output }: { input: SolangInput; output: SolangOutput },
    { config, artifacts }
  ) => {
    if (!input.sources.length) return;

    for (const filepath of output.outputFiles) {
      const abiJSON = fs.readJSONSync(filepath);

      const filename = filepath.split('.').slice(0, -1).join('.');

      fs.writeJSONSync(
        path.resolve(config.paths.artifacts, `${filename}.contract`),
        abiJSON,
        { spaces: 2 }
      );

      delete abiJSON.source.wasm;

      fs.writeJSONSync(
        path.resolve(config.paths.artifacts, `${filename}.json`),
        abiJSON,
        { spaces: 2 }
      );
    }

    console.log('');
    console.log(
      `🎉  Compile successfully! You can find all artifacts at ${chalk.cyan(
        output.outputDirectory
      )}`
    );
  }
);

subtask(TASK_COMPILE_SOLANG)
  .addOptionalVariadicPositionalParam(
    'sourcePattern',
    'A glob string that is matched against',
    []
  )
  .setAction(
    async (
      {
        sourcePattern
      }: {
        sourcePattern: string[];
      },
      { run }
    ) => {
      await run(TASK_COMPILE_SOLANG_PRE);

      const input = await run(TASK_COMPILE_SOLANG_INPUT, {
        sourcePattern
      });
      const output = await run(TASK_COMPILE_SOLANG_EXEC, { input });
      await run(TASK_COMPILE_SOLANG_OUTPUT, { input, output });
    }
  );
