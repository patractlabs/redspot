import Mocha from 'mocha';
import deasync from 'deasync';
import util from 'util';
import { GasTable } from './gasTable';
import { Config } from './config';

const inherits = util.inherits;
const Spec = Mocha.reporters.Spec;
const color = Spec.color;
const log = console.log;

// const utils = require('./lib/utils');
// const Config = require('./lib/config');
// const TransactionWatcher = require('./lib/transactionWatcher');
// const GasTable = require('./lib/gasTable');
// const SyncRequest = require('./lib/syncRequest');

export function GasReporter(runner, options) {
  // Spec reporter
  Spec.call(this, runner, options);

  // const self = this;

  // let indents = 0;
  // let n = 0;
  // let failed = false;
  // let indent = () => Array(indents).join('  ');

  // // Gas reporter setup
  const config = new Config(options.reporterOptions);
  // const watch = new TransactionWatcher(config);
  const table = new GasTable(config);

  // // Expose internal methods to plugins
  // if (typeof options.attachments === 'object') {
  //   options.attachments.recordTransaction = watch.transaction.bind(watch);
  // }

  // // These call the cloud, start running them.
  // utils.setGasAndPriceRates(config);

  // // ------------------------------------  Runners -------------------------------------------------

  // runner.on('start', () => {
  //   watch.data.initialize(config);
  // });

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

  runner.on('end', async () => {
    let done = false;

    setTimeout(() => {
      table.generate();
    }, 4000);

    deasync.loopWhile(function () {
      return !done;
    });
  });
}

/**
 * Inherit from `Spec.prototype`.
 */
inherits(GasReporter, Spec);
