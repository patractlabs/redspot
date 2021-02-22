import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
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

subtask(TASK_COMPILE_SOLANG_PRE, async (_, { config }) => {
  const isValidEnv = await checkEnv({ version: '0.8.0' });

  if (!isValidEnv) {
    throw new RedspotError(ERRORS.BUILTIN_TASKS.SOLANG_ENV_ERROR);
  }
});

subtask(TASK_COMPILE_SOLANG_INPUT, async (_, { config }) => {
  const input = await getCompilerInput(config.contract.ink);

  return input;
});

subtask(
  TASK_COMPILE_SOLANG_EXEC,
  async ({ input }: { input: SolangInput }, { config, redspotArguments }) => {
    const output = await compile(input, config.paths.artifacts);

    return output;
  }
);

subtask(
  TASK_COMPILE_SOLANG_OUTPUT,
  async ({ output }: { output: SolangOutput[] }, { config, artifacts }) => {
    // for (const target of output) {
    //   const abiJSON = fs.readJSONSync(target.contract)
    //   delete abiJSON.source.wasm;
    //   fs.ensureDirSync(config.paths.artifacts)
    //   fs.writeJSONSync(path.resolve(config.paths.artifacts, `${target.name}.json`), abiJSON, { spaces: 2 })
    //   artifacts.copyToArtifactDir([target.wasm, target.contract])
    // }
    // console.log('')
    // console.log(
    //   `🎉  Compile successfully! You can find all artifacts at ${chalk.cyan(
    //     config.paths.artifacts
    //   )}`
    // );
  }
);

subtask(TASK_COMPILE_SOLANG, async (_, { run }) => {
  await run(TASK_COMPILE_SOLANG_PRE);

  const input = await run(TASK_COMPILE_SOLANG_INPUT);
  const output = await run(TASK_COMPILE_SOLANG_EXEC, { input });
  await run(TASK_COMPILE_SOLANG_OUTPUT, { output });
});
