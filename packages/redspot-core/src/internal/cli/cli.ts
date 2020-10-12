#!/usr/bin/env node
import chalk from "chalk";
import debug from "debug";
import semver from "semver";
import "source-map-support/register";
import { TASK_HELP } from "../../builtin-tasks/task-names";
import { TaskArguments } from "../../types";
import { REDSPOT_NAME } from "../constants";
import { RedspotContext } from "../context";
import { loadConfigAndTasks } from "../core/config/config-loading";
import { RedspotError, RedspotPluginError } from "../core/errors";
import { ERRORS, getErrorCode } from "../core/errors-list";
import { getEnvRedspotArguments } from "../core/params/env-variables";
import { REDSPOT_PARAM_DEFINITIONS } from "../core/params/redspot-params";
import { isCwdInsideProject } from "../core/project-structure";
import { Environment } from "../core/runtime-environment";
import { loadTsNodeIfPresent } from "../core/typescript-support";
import { Reporter } from "../sentry/reporter";
import { getPackageJson, PackageJson } from "../util/packageInfo";
import { Analytics } from "./analytics";
import { ArgumentsParser } from "./ArgumentsParser";

const log = debug("redspot:core:cli");

const ANALYTICS_SLOW_TASK_THRESHOLD = 300;

async function printVersionMessage(packageJson: PackageJson) {
  console.log(packageJson.version);
}

function ensureValidNodeVersion(packageJson: PackageJson) {
  const requirement = packageJson.engines.node;
  if (!semver.satisfies(process.version, requirement)) {
    throw new RedspotError(ERRORS.GENERAL.INVALID_NODE_VERSION, {
      requirement,
    });
  }
}

async function main() {
  // We first accept this argument anywhere, so we know if the user wants
  // stack traces before really parsing the arguments.
  let showStackTraces = process.argv.includes("--show-stack-traces");

  try {
    const packageJson = await getPackageJson();

    ensureValidNodeVersion(packageJson);

    const envVariableArguments = getEnvRedspotArguments(
      REDSPOT_PARAM_DEFINITIONS,
      process.env
    );

    const argumentsParser = new ArgumentsParser();

    const {
      redspotArguments,
      taskName: parsedTaskName,
      unparsedCLAs,
    } = argumentsParser.parseRedspotArguments(
      REDSPOT_PARAM_DEFINITIONS,
      envVariableArguments,
      process.argv.slice(2)
    );

    if (redspotArguments.verbose) {
      Reporter.setVerbose(true);
      debug.enable("redspot*");
    }

    showStackTraces = redspotArguments.showStackTraces;

    if (
      redspotArguments.config === undefined &&
      !isCwdInsideProject() &&
      process.stdout.isTTY === true
    ) {
      console.log("TODO: create project");
      return;
    }

    // --version is a special case
    if (redspotArguments.version) {
      await printVersionMessage(packageJson);
      return;
    }

    loadTsNodeIfPresent();

    const ctx = RedspotContext.createRedspotContext();
    const config = loadConfigAndTasks(redspotArguments);

    const analytics = await Analytics.getInstance(
      config.paths.root,
      config.analytics.enabled
    );

    Reporter.setConfigPath(config.paths.configFile);
    Reporter.setEnabled(config.analytics.enabled);

    const envExtenders = ctx.extendersManager.getExtenders();
    const taskDefinitions = ctx.tasksDSL.getTaskDefinitions();

    let taskName = parsedTaskName !== undefined ? parsedTaskName : "help";

    // tslint:disable-next-line: prefer-const
    let [abortAnalytics, hitPromise] = await analytics.sendTaskHit(taskName);

    let taskArguments: TaskArguments;

    // --help is a also special case
    if (redspotArguments.help && taskName !== TASK_HELP) {
      taskArguments = { task: taskName };
      taskName = TASK_HELP;
    } else {
      const taskDefinition = taskDefinitions[taskName];

      if (taskDefinition === undefined) {
        throw new RedspotError(ERRORS.ARGUMENTS.UNRECOGNIZED_TASK, {
          task: taskName,
        });
      }

      taskArguments = argumentsParser.parseTaskArguments(
        taskDefinition,
        unparsedCLAs
      );
    }

    // TODO: This is here for backwards compatibility
    // There are very few projects using this.
    if (redspotArguments.network === undefined) {
      redspotArguments.network = config.defaultNetwork;
    }

    const env = new Environment(
      config,
      redspotArguments,
      taskDefinitions,
      envExtenders
    );

    ctx.setRedspotRuntimeEnvironment(env);

    const timestampBeforeRun = new Date().getTime();

    await env.run(taskName, taskArguments);

    const timestampAfterRun = new Date().getTime();
    if (
      timestampAfterRun - timestampBeforeRun >
      ANALYTICS_SLOW_TASK_THRESHOLD
    ) {
      await hitPromise;
    } else {
      abortAnalytics();
    }
    log(`Killing Redspot after successfully running task ${taskName}`);
  } catch (error) {
    let isRedspotError = false;

    if (RedspotError.isRedspotError(error)) {
      isRedspotError = true;
      console.error(chalk.red(`Error ${error.message}`));
    } else if (RedspotPluginError.isRedspotPluginError(error)) {
      isRedspotError = true;
      console.error(
        chalk.red(`Error in plugin ${error.pluginName}: ${error.message}`)
      );
    } else if (error instanceof Error) {
      console.error(chalk.red("An unexpected error occurred:"));
      showStackTraces = true;
    } else {
      console.error(chalk.red("An unexpected error occurred."));
      showStackTraces = true;
    }

    console.log("");

    try {
      Reporter.reportError(error);
    } catch (error) {
      log("Couldn't report error to sentry: %O", error);
    }

    if (showStackTraces) {
      console.error(error);
    } else {
      if (!isRedspotError) {
        console.error(
          `If you think this is a bug in Redspot, please report it here: https://github.com/patractlabs/redspot-0.2/issues/new`
        );
      }

      if (RedspotError.isRedspotError(error)) {
        const link = `https://redspot.dev/${getErrorCode(
          error.errorDescriptor
        )}`;

        console.error(
          `For more info go to ${link} or run ${REDSPOT_NAME} with --show-stack-traces`
        );
      } else {
        console.error(
          `For more info run ${REDSPOT_NAME} with --show-stack-traces`
        );
      }
    }

    await Reporter.close(1000);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(process.exitCode))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
