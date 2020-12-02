import deasync from 'deasync';
import Mocha from 'mocha';
import util from 'util';
import { TransactionWatcher } from './transactionWatcher';

const inherits = util.inherits;
const Spec = Mocha.reporters.Spec;
const log = console.log;

export function GasReporter(runner, options) {
  // Spec reporter
  Spec.call(this, runner, options);

  // const self = this;

  // let indents = 0;
  // let n = 0;
  // let failed = false;
  // let indent = () => Array(indents).join('  ');

  const watch = new TransactionWatcher(options.reporterOptions);

  // // Expose internal methods to plugins
  // if (typeof options.attachments === 'object') {
  //   options.attachments.recordTransaction = watch.transaction.bind(watch);
  // }

  // // These call the cloud, start running them.
  // utils.setGasAndPriceRates(config);

  // // ------------------------------------  Runners -------------------------------------------------
  const data = [];
  runner.on('start', () => {
    watch.initialize();
  });

  // runner.on('suite', (suite) => {
  //   ++indents;
  //   log(color('suite', '%s%s'), indent(), suite.title);
  // });

  // runner.on('suite end', () => {
  //   --indents;
  //   if (indents === 1) {
  //     log();
  //   }
  // });

  // runner.on('pending', (test) => {
  //   let fmt = indent() + color('pending', '  - %s');
  //   log(fmt, test.title);
  // });

  // runner.on('test', () => {
  //   if (!config.provider) {
  //     watch.beforeStartBlock = sync.blockNumber();
  //   }
  //   watch.data.resetAddressCache();
  // });

  // runner.on('hook end', (hook) => {
  //   if (hook.title.includes('before each') && !config.provider) {
  //     watch.itStartBlock = sync.blockNumber() + 1;
  //   }
  // });

  runner.on('end', () => {
    let done = false;

    watch
      .getTable()
      .then((data) => {
        log(data);
      })
      .then(() => {
        return watch.stop();
      })
      .finally(() => {
        done = true;
      });

    deasync.loopWhile(function () {
      return !done;
    });
  });
}

/**
 * Inherit from `Spec.prototype`.
 */
inherits(GasReporter, Spec);
