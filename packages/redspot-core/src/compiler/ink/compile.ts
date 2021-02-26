import execa from 'execa';
import path from 'path';
import fs from 'fs-extra';
import { InkInput } from './compilerInput';
import chalk from 'chalk';
import { RedspotError } from '../../internal/core/errors';
import { ERRORS } from '../../internal/core/errors-list';

export type InkOutput = {
  name: string;
  wasm: string;
  contract: string;
};

export async function compile(input: InkInput, verbose?: boolean) {
  const output: InkOutput[] = [];

  for (const source of input.sources) {
    let args = [
      `+${input.toolchain}`,
      `contract`,
      'build',
      '--manifest-path',
      source.manifestPath
    ];

    if (verbose) {
      args = args.concat('--', 'verbose');
    }

    console.log('');
    console.log(chalk.magenta(`===== Compile ${source.name} =====`));
    console.log('');

    await execa('cargo', args, {
      stdio: 'inherit'
    });

    let result: InkOutput | undefined;

    if (
      fs.existsSync(
        path.resolve(source.targetDirectory, `${source.name}.wasm`)
      ) &&
      fs.existsSync(
        path.resolve(source.targetDirectory, `${source.name}.contract`)
      )
    ) {
      result = {
        name: source.name,
        wasm: path.resolve(source.targetDirectory, `${source.name}.wasm`),
        contract: path.resolve(
          source.targetDirectory,
          `${source.name}.contract`
        )
      };
    } else if (
      fs.existsSync(
        path.resolve(source.targetDirectory, 'ink', `${source.name}.wasm`)
      ) &&
      fs.existsSync(
        path.resolve(source.targetDirectory, 'ink', `${source.name}.contract`)
      )
    ) {
      result = {
        name: source.name,
        wasm: path.resolve(
          source.targetDirectory,
          'ink',
          `${source.name}.wasm`
        ),
        contract: path.resolve(
          source.targetDirectory,
          'ink',
          `${source.name}.contract`
        )
      };
    } else if (
      fs.existsSync(
        path.resolve(
          source.targetDirectory,
          'ink',
          source.name,
          `${source.name}.wasm`
        )
      ) &&
      fs.existsSync(
        path.resolve(
          source.targetDirectory,
          'ink',
          source.name,
          `${source.name}.contract`
        )
      )
    ) {
      result = {
        name: source.name,
        wasm: path.resolve(
          source.targetDirectory,
          'ink',
          source.name,
          `${source.name}.wasm`
        ),
        contract: path.resolve(
          source.targetDirectory,
          'ink',
          source.name,
          `${source.name}.contract`
        )
      };
    }

    if (!result) {
      throw new RedspotError(ERRORS.BUILTIN_TASKS.INK_NOT_FOUND_ARTIFACT);
    }

    output.push(result);
  }

  return output;
}
