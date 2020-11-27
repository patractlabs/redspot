import path from 'path';
import { subtask, task } from '../internal/core/config/config-env';
import { isRunningWithTypescript } from '../internal/core/typescript-support';
import { glob } from '../internal/util/glob';
import {
  TASK_COMPILE,
  TASK_TEST,
  TASK_TEST_GET_TEST_FILES,
  TASK_TEST_RUN_MOCHA_TESTS,
  TASK_TEST_SETUP_TEST_ENVIRONMENT
} from './task-names';

subtask(TASK_TEST_GET_TEST_FILES)
  .addOptionalVariadicPositionalParam(
    'testFiles',
    'An optional list of files to test',
    []
  )
  .setAction(async ({ testFiles }: { testFiles: string[] }, { config }) => {
    if (testFiles.length !== 0) {
      return testFiles;
    }

    const jsFiles = await glob(path.join(config.paths.tests, '**/*.js'));

    if (!isRunningWithTypescript(config)) {
      return jsFiles;
    }

    const tsFiles = await glob(path.join(config.paths.tests, '**/*.ts'));

    return [...jsFiles, ...tsFiles];
  });

subtask(TASK_TEST_SETUP_TEST_ENVIRONMENT, async () => {});

subtask(TASK_TEST_RUN_MOCHA_TESTS)
  .addOptionalVariadicPositionalParam(
    'testFiles',
    'An optional list of files to test',
    []
  )
  .setAction(async ({ testFiles }: { testFiles: string[] }, { config }) => {
    const { default: Mocha } = await import('mocha');
    const mocha = new Mocha(config.mocha);

    testFiles.forEach((file) => mocha.addFile(file));

    const testFailures = await new Promise<number>((resolve, _) => {
      mocha.run(resolve);
    });

    return testFailures;
  });

task(TASK_TEST, 'Runs mocha tests')
  .addOptionalVariadicPositionalParam(
    'testFiles',
    'An optional list of files to test',
    []
  )
  .addFlag('noCompile', "Don't compile before running this task")
  .setAction(
    async (
      {
        noCompile,
        testFiles
      }: {
        testFiles: string[];
        noCompile: boolean;
      },
      { network, run }
    ) => {
      if (!noCompile) {
        await run(TASK_COMPILE, { quiet: true });
      }

      const files = await run(TASK_TEST_GET_TEST_FILES, { testFiles });

      await run(TASK_TEST_SETUP_TEST_ENVIRONMENT);

      const testFailures = await run(TASK_TEST_RUN_MOCHA_TESTS, {
        testFiles: files
      });

      process.exitCode = testFailures;

      return testFailures;
    }
  );
