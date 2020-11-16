#!/usr/bin/env node
import chalk from 'chalk';
import debug from 'debug';
import semver from 'semver';
import 'source-map-support/register';
import { TASK_COMPILE, TASK_HELP } from '../../builtin-tasks/task-names';
import { TaskArguments } from '../../types';
import { REDSPOT_NAME } from '../constants';
import { RedspotContext } from '../context';
import { loadConfigAndTasks } from '../core/config/config-loading';
import { RedspotError, RedspotPluginError } from '../core/errors';
import { ERRORS, getErrorCode } from '../core/errors-list';
import { isRedspotInstalledLocallyOrLinked } from '../core/execution-mode';
import { getEnvRedspotArguments } from '../core/params/env-variables';
import { REDSPOT_PARAM_DEFINITIONS } from '../core/params/redspot-params';
import { isCwdInsideProject } from '../core/project-structure';
import { Environment } from '../core/runtime-environment';
import { loadTsNode, willRunWithTypescript } from '../core/typescript-support';
import { isRunningOnCiServer } from '../util/ci-detection';
import {
  hasConsentedTelemetry,
  writeTelemetryConsent
} from '../util/global-dir';
import { getPackageJson, PackageJson } from '../util/packageInfo';
import { Analytics } from './analytics';
import { ArgumentsParser } from './ArgumentsParser';
import { enableEmoji } from './emoji';
import { confirmTelemetryConsent, createProject } from './project-creation';

const log = debug('redspot:core:cli');

const ANALYTICS_SLOW_TASK_THRESHOLD = 300;

async function printVersionMessage(packageJson: PackageJson) {
  console.log(packageJson.version);
}

function ensureValidNodeVersion(packageJson: PackageJson) {
  const requirement = packageJson.engines.node;
  if (!semver.satisfies(process.version, requirement)) {
    throw new RedspotError(ERRORS.GENERAL.INVALID_NODE_VERSION, {
      requirement
    });
  }
}

async function main() {
  // We first accept this argument anywhere, so we know if the user wants
  // stack traces before really parsing the arguments.
  let showStackTraces = process.argv.includes('--show-stack-traces');

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
      unparsedCLAs
    } = argumentsParser.parseRedspotArguments(
      REDSPOT_PARAM_DEFINITIONS,
      envVariableArguments,
      process.argv.slice(2)
    );

    if (redspotArguments.verbose) {
      debug.enable('redspot*');
    }

    if (redspotArguments.emoji) {
      enableEmoji();
    }

    showStackTraces = redspotArguments.showStackTraces;

    if (
      redspotArguments.config === undefined &&
      !isCwdInsideProject() &&
      process.stdout.isTTY === true
    ) {
      // await createProject();
      console.log(chalk.red(`You are not inside a Redspot project.`));
      console.log('');
      console.log(
        `Run the following command to create a new Redspot project: `
      );
      console.log(chalk.cyan(`  $ npx redspot-new <project-name>`));
      console.log('');
      return;
    }

    // --version is a special case
    if (redspotArguments.version) {
      await printVersionMessage(packageJson);
      return;
    }

    if (!isRedspotInstalledLocallyOrLinked()) {
      throw new RedspotError(ERRORS.GENERAL.NON_LOCAL_INSTALLATION);
    }

    if (willRunWithTypescript(redspotArguments.config)) {
      loadTsNode();
    }

    let taskName = parsedTaskName ?? TASK_HELP;

    const showWarningIfNoSolidityConfig = taskName === TASK_COMPILE;

    const ctx = RedspotContext.createRedspotContext();
    const config = loadConfigAndTasks(redspotArguments, {
      showWarningIfNoSolidityConfig
    });

    let telemetryConsent: boolean | undefined = hasConsentedTelemetry();

    const isHelpCommand = redspotArguments.help || taskName === TASK_HELP;
    if (
      telemetryConsent === undefined &&
      !isHelpCommand &&
      !isRunningOnCiServer() &&
      process.stdout.isTTY === true
    ) {
      telemetryConsent = await confirmTelemetryConsent();

      if (telemetryConsent !== undefined) {
        writeTelemetryConsent(telemetryConsent);
      }
    }

    const analytics = await Analytics.getInstance(telemetryConsent);

    const envExtenders = ctx.extendersManager.getExtenders();
    const taskDefinitions = ctx.tasksDSL.getTaskDefinitions();

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
          task: taskName
        });
      }

      if (taskDefinition.isSubtask) {
        throw new RedspotError(ERRORS.ARGUMENTS.RUNNING_SUBTASK_FROM_CLI, {
          name: taskDefinition.name
        });
      }

      taskArguments = argumentsParser.parseTaskArguments(
        taskDefinition,
        unparsedCLAs
      );
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
      console.error(chalk.red('An unexpected error occurred:'));
      showStackTraces = true;
    } else {
      console.error(chalk.red('An unexpected error occurred.'));
      showStackTraces = true;
    }

    console.log('');

    if (showStackTraces) {
      console.error(error);
    } else {
      if (!isRedspotError) {
        console.error(
          `If you think this is a bug in Redspot, please report it here: https://github.com/patractlabs/redspot-0.2/issues/new`
        );
      }

      if (RedspotError.isRedspotError(error)) {
        const link = `https://redspot.org/${getErrorCode(
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

    process.exit(1);
  }
}

main()
  .then(() => process.exit(process.exitCode))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
