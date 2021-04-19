import chalk from 'chalk';
import { execSync } from 'child_process';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import yargs, { argv } from 'yargs';
import { cloneRepo, mkCacheDir, rmCacheDir } from './utils';

const packageToInstall = 'redspot';

function init() {
  const currentNodeVersion = process.versions.node;

  if (+currentNodeVersion.split('.')[0] < 10) {
    console.error(
      `You are running Node ${currentNodeVersion}. \nRedspot requires Node 10 or higher. \nPlease update your version of Node.`
    );
    process.exit(1);
  }

  const argv = yargs
    .usage(`Usage: $0 ${chalk.green('<project-name>')} [options]`)
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: 'Run with verbose logging'
    })
    .option('template', {
      type: 'string',
      default: 'erc20',
      description: 'Specify a template for the created project'
    })
    .demandCommand(
      1,
      `Please specify the project name, for example: \n  ${chalk.cyan(
        'redspot-new'
      )} ${chalk.green('erc20')}`
    )
    .example(
      '$0 erc20',
      'Initializes a new Substrate contract project in the specified directory'
    )
    .epilog('Power by patract labs').argv;

  const projectName = argv._[0];

  createApp(projectName, argv.verbose);
}

function createApp(name: string, verbose: boolean): void {
  const root = path.resolve(name);
  const appName = path.basename(root);

  checkDirName(appName);

  fs.ensureDirSync(name);

  if (!isSafeToCreateApp(root, name)) {
    process.exit(1);
  }

  console.log();
  console.log(`✨  Creating a new Project in ${chalk.green(root)}.`);

  const cacheDir = mkCacheDir(root);

  const repo = 'https://github.com/patractlabs/redspot-template.git';
  console.log(`Clone template from ${repo}`);
  const gitDir = path.join(cacheDir, 'redspot-template');
  cloneRepo(repo, gitDir);

  const templateName = argv.template;
  fs.copySync(path.join(gitDir, `packages/${templateName}`), root);

  process.chdir(root);

  const useYarn = shouldUseYarn();

  run(root, appName, useYarn, verbose);
}

function run(
  root: string,
  appName: string,
  useYarn: boolean,
  verbose: boolean
) {
  // rename package.json name field
  const packageJson = require(path.join(root, 'package.json'));
  packageJson.name = appName;
  fs.writeJSONSync(path.join(root, 'package.json'), packageJson);

  console.log('Installing packages. This might take a while.');

  install(root, useYarn, verbose)
    .then(async () => {
      checkNodeVersion(packageToInstall);

      // clean cache
      console.log('Clean cache.');
      rmCacheDir(root);
    })
    .catch((reason) => {
      console.log();
      console.log('Aborting installation.');
      if (reason.command) {
        console.log(`  ${chalk.cyan(reason.command)} has failed.`);
      } else {
        console.log(chalk.red('Unexpected error. Please report it as a bug:'));
        console.log(reason);
      }

      console.log();
      console.log('Done.');
      process.exit(1);
    });
}

function install(root: string, useYarn: boolean, verbose: boolean) {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];

    if (useYarn) {
      command = 'yarnpkg';
      args = ['install'];

      args.push('--cwd');
      args.push(root);
    } else {
      command = 'npm';
      args = ['install', '--loglevel', 'error'];
    }

    if (verbose) {
      args.push('--verbose');
    }

    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code !== 0) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          command: `${command} ${args.join(' ')}`
        });
        return;
      }
      resolve(undefined);
    });
  });
}

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function checkDirName(dirname: string): void {}

function checkNodeVersion(packageName: string) {
  const packageJsonPath = path.resolve(
    process.cwd(),
    'node_modules',
    packageName,
    'package.json'
  );

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = require(packageJsonPath);
  if (!packageJson.engines || !packageJson.engines.node) {
    return;
  }

  if (!semver.satisfies(process.version, packageJson.engines.node)) {
    console.error(
      chalk.red(
        'You are running Node %s.\n' +
          'Redspot requires Node %s or higher. \n' +
          'Please update your version of Node.'
      ),
      process.version,
      packageJson.engines.node
    );
    process.exit(1);
  }
}

function isSafeToCreateApp(root: string, name: string): boolean {
  const files = fs.readdirSync(root);

  if (files.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} is not an empty directory.`
    );
    console.log();
    console.log(`Try using a new directory name.`);

    return false;
  }

  return true;
}

function executeNodeScript(
  { cwd, args }: { cwd: string; args: string[] },
  data: any[],
  source: string
) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [...args, '-e', source, '--', JSON.stringify(data)],
      {
        cwd,
        stdio: 'inherit'
      }
    );

    child.on('close', (code) => {
      if (code !== 0) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          command: `node ${args.join(' ')}`
        });
        return;
      }
      resolve(undefined);
    });
  });
}

export { init, createApp, executeNodeScript };
