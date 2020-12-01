import { TASK_TEST_RUN_MOCHA_TESTS } from 'redspot/builtin-tasks/task-names';
import { subtask } from 'redspot/config';
import { RedspotRuntimeEnvironment } from 'redspot/types';
import './type-extensions';
import { GasReporterConfig } from './types';
import { GasReporter } from './reporter';

let mochaConfig;

/**
 * Sets reporter options to pass to gas-reporter:
 *
 * @param  {RedspotRuntimeEnvironment} rse
 * @return {GasReporterConfig}
 */
function getDefaultOptions(rse: RedspotRuntimeEnvironment): GasReporterConfig {
  return {
    enabled: true
  };
}

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {RedspotRuntimeEnvironment} rse
 * @return {any}
 */
function getOptions(rse: RedspotRuntimeEnvironment): any {
  return { ...getDefaultOptions(rse), ...(rse.config as any).gasReporter };
}

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async (args: any, rse, runSuper) => {
    const options = getOptions(rse);

    if (options.enabled) {
      mochaConfig = rse.config.mocha || {};
      mochaConfig.reporter = GasReporter;
      mochaConfig.reporterOptions = options;

      rse.config.mocha = mochaConfig;
    }

    return runSuper();
  }
);
