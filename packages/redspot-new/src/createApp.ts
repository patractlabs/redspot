import chalk from "chalk";
import { execSync } from "child_process";
import spawn from "cross-spawn";
import fs from "fs-extra";
import os from "os";
import path from "path";
import semver from "semver";
import yargs, { argv } from "yargs";

const packageToInstall = "redspot";
const templateToInstall = "@redspot/redspot-template";
const tag = "alpha";

function init() {
  const currentNodeVersion = process.versions.node;

  if (+currentNodeVersion.split(".")[0] < 10) {
    console.error(
      `You are running Node ${currentNodeVersion}. \nRedspot requires Node 10 or higher. \nPlease update your version of Node.`
    );
    process.exit(1);
  }

  const argv = yargs
    .usage(`Usage: $0 ${chalk.green("<project-name>")} [options]`)
    .option("verbose", {
      alias: "v",
      type: "boolean",
      default: false,
      description: "Run with verbose logging",
    })
    .option("template", {
      type: "string",
      default: "flipper",
      description: "specify a template for the created project",
    })
    .demandCommand(
      1,
      `Please specify the project name, for example: \n  ${chalk.cyan(
        "redspot-new"
      )} ${chalk.green("flipper")}`
    )
    .example(
      "$0 flipper",
      "initializes a new Substrate contract project in the specified directory"
    )
    .epilog("power by patract labs").argv;

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

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
  };

  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  const originalDirectory = process.cwd();
  process.chdir(root);

  const useYarn = shouldUseYarn();

  run(root, appName, originalDirectory, useYarn, verbose);
}

function run(
  root: string,
  appName: string,
  originalDirectory: string,
  useYarn: boolean,
  verbose: boolean
) {
  const templateName = argv.template;
  const allDependencies = [packageToInstall, templateToInstall];

  console.log("Installing packages. This might take a while.");

  install(root, allDependencies, useYarn, tag, verbose)
    .then(async () => {
      checkNodeVersion(packageToInstall);

      await executeNodeScript(
        {
          cwd: process.cwd(),
          args: [],
        },
        [
          root,
          appName,
          verbose,
          originalDirectory,
          templateToInstall,
          templateName,
        ],
        `
    var { init } = require('${packageToInstall}/internal/cli/init.js');
    init.apply(null, JSON.parse(process.argv[1]));
  `
      );
    })
    .catch((reason) => {
      console.log();
      console.log("Aborting installation.");
      if (reason.command) {
        console.log(`  ${chalk.cyan(reason.command)} has failed.`);
      } else {
        console.log(chalk.red("Unexpected error. Please report it as a bug:"));
        console.log(reason);
      }
      console.log();

      const knownGeneratedFiles = [
        "package.json",
        "yarn.lock",
        "package-lock.json",
        "node_modules",
      ];
      const currentFiles = fs.readdirSync(path.join(root));
      currentFiles.forEach((file) => {
        knownGeneratedFiles.forEach((fileToMatch) => {
          if (file === fileToMatch) {
            console.log(`Deleting generated file... ${chalk.cyan(file)}`);
            fs.removeSync(path.join(root, file));
          }
        });
      });
      const remainingFiles = fs.readdirSync(path.join(root));
      if (!remainingFiles.length) {
        console.log(
          `Deleting ${chalk.cyan(`${appName}/`)} from ${chalk.cyan(
            path.resolve(root, "..")
          )}`
        );
        process.chdir(path.resolve(root, ".."));
        fs.removeSync(path.join(root));
      }
      console.log("Done.");
      process.exit(1);
    });
}

function install(
  root: string,
  dependencies: string[],
  useYarn: boolean,
  tag: string,
  verbose: boolean
) {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];

    const dependenciesWithTag = !tag
      ? dependencies
      : dependencies.map((d) => `${d}@${tag}`);

    if (useYarn) {
      command = "yarnpkg";
      args = ["add", "--exact"];

      [].push.apply(args, dependenciesWithTag as any);

      args.push("--cwd");
      args.push(root);
    } else {
      command = "npm";
      args = [
        "install",
        "--save",
        "--save-exact",
        "--loglevel",
        "error",
      ].concat(dependenciesWithTag);
    }

    if (verbose) {
      args.push("--verbose");
    }

    const child = spawn(command, args, { stdio: "inherit" });

    child.on("close", (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`,
        });
        return;
      }
      resolve();
    });
  });
}

function shouldUseYarn() {
  try {
    execSync("yarnpkg --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function checkDirName(dirname: string): void {}

function checkNodeVersion(packageName: string) {
  const packageJsonPath = path.resolve(
    process.cwd(),
    "node_modules",
    packageName,
    "package.json"
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
        "You are running Node %s.\n" +
          "Redspot requires Node %s or higher. \n" +
          "Please update your version of Node."
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
      [...args, "-e", source, "--", JSON.stringify(data)],
      {
        cwd,
        stdio: "inherit",
      }
    );

    child.on("close", (code) => {
      if (code !== 0) {
        reject({
          command: `node ${args.join(" ")}`,
        });
        return;
      }
      resolve();
    });
  });
}

export { init, createApp, executeNodeScript };
