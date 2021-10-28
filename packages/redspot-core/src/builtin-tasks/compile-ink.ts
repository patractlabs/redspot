import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { checkEnv } from '../compiler/ink/checkEnv';
import { compile, InkOutput } from '../compiler/ink/compile';
import {
  compileDocker,
  DOCKER_IMAGE_NAME
} from '../compiler/ink/compileDocker';
import { getCompilerInput, InkInput } from '../compiler/ink/compilerInput';
import { subtask } from '../internal/core/config/config-env';
import { RedspotError } from '../internal/core/errors';
import { ERRORS } from '../internal/core/errors-list';
import { boolean } from '../internal/core/params/argumentTypes';
import {
  TASK_COMPILE_INK,
  TASK_COMPILE_INK_EXEC,
  TASK_COMPILE_INK_INPUT,
  TASK_COMPILE_INK_OUTPUT,
  TASK_COMPILE_INK_PRE
} from './task-names';

subtask(TASK_COMPILE_INK_PRE, async (_, { config }) => {
  const isValidEnv = await checkEnv({ version: '0.15.0' });

  if (!isValidEnv) {
    throw new RedspotError(ERRORS.BUILTIN_TASKS.INK_ENV_ERROR, {
      version: 'v0.15.0'
    });
  }

  console.log(`compiler version: ${isValidEnv}`);
  console.log(`toolchain: ${config.contract.ink.toolchain}`);
});

subtask(TASK_COMPILE_INK_INPUT)
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
      const input = await getCompilerInput(config.contract.ink, sourcePattern);

      return input;
    }
  );

subtask(
  TASK_COMPILE_INK_EXEC,
  async ({ input }: { input: InkInput }, { redspotArguments }) => {
    if (!input.sources.length) return;

    const output = await compile(
      input,
      redspotArguments.verbose,
      redspotArguments.release
    );

    return output;
  }
);

subtask(
  TASK_COMPILE_INK_OUTPUT,
  async (
    { input, output }: { input: InkInput; output: InkOutput[] },
    { config, artifacts }
  ) => {
    if (!input.sources.length) return;

    fs.ensureDirSync(config.paths.artifacts);

    const names: string[] = [];
    const paths: string[] = [];
    for (const target of output) {
      if (names.includes(target.name)) {
        throw new RedspotError(ERRORS.BUILTIN_TASKS.INK_DUPLICATE_NAME, {
          path1: paths[names.indexOf(target.name)],
          path2: target.contract
        });
      }

      const abiJSON = fs.readJSONSync(target.contract);

      fs.writeJSONSync(
        path.resolve(config.paths.artifacts, `${target.name}.contract`),
        abiJSON,
        { spaces: 2 }
      );

      delete abiJSON.source.wasm;

      fs.writeJSONSync(
        path.resolve(config.paths.artifacts, `${target.name}.json`),
        abiJSON,
        { spaces: 2 }
      );

      names.push(target.name);
      paths.push(target.contract);
    }
    console.log('');
    console.log(
      `🎉  Compile successfully! You can find all artifacts at ${chalk.cyan(
        path.relative(config.paths.root, config.paths.artifacts)
      )}`
    );
  }
);

subtask(TASK_COMPILE_INK)
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
      const useDocker =
        docker !== undefined ? docker : config.contract.ink.docker;

      if (useDocker) {
        console.log(`use docker image: ${DOCKER_IMAGE_NAME}`);

        compileDocker(config, sourcePattern);
      } else {
        await run(TASK_COMPILE_INK_PRE);

        const input = await run(TASK_COMPILE_INK_INPUT, { sourcePattern });
        const output = await run(TASK_COMPILE_INK_EXEC, { input });
        await run(TASK_COMPILE_INK_OUTPUT, { input, output });
      }
    }
  );
