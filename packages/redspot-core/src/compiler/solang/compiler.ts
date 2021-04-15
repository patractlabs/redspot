import chalk from 'chalk';
import { execSync } from 'child_process';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';

export interface CompilerOptions {
  verbose?: boolean;
}

export class Compiler {
  private readonly _verbose: boolean;

  constructor({ verbose = false }: CompilerOptions = {}) {
    this._verbose = verbose;
    this._checkSolang();
  }

  public _checkSolang() {
    try {
      execSync('solang -V ');
    } catch (error) {
      console.log(chalk.red('ERROR: No `solang` command found'));
      console.log(`Run the following command to install it:`);
      console.log(chalk.cyan(`$ cargo install solang  --force --locked`));

      return false;
    }

    return true;
  }

  public async run(inputDir: string, outPutdir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.ensureDirSync(path.resolve(outPutdir));

      const input = fs
        .readdirSync(path.resolve(inputDir))
        .filter((f) => f.match(/\.sol$/g));

      let args = [
        `--target`,
        `substrate`,
        '--output',
        path.resolve(outPutdir),
        input.join(' ')
      ];

      if (this._verbose) {
        args = args.concat('--', 'verbose');
      }

      const child = spawn('solang', args, {
        stdio: 'inherit',
        cwd: path.resolve(inputDir)
      });

      console.log(`$ solang ${args.join(' ')}`);

      child.on('close', (code) => {
        if (code !== 0) {
          console.log();
          console.log(chalk.red(`Failed to compile the contracts`));
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({
            command: `solang ${args.join(' ')}`
          });

          return;
        }

        console.log(
          `🎉  Compile successfully! You can find them at ${chalk.cyan(
            path.resolve(outPutdir)
          )}`
        );
        console.log('');

        resolve(undefined);
      });
    });
  }
}
