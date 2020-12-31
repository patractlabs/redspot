import deasync from 'deasync';
import Mocha from 'mocha';
import util from 'util';
import { TransactionWatcher } from './Watcher';

const inherits = util.inherits;
const Spec = Mocha.reporters.Spec;
const log = console.log;

export function GasReporter(runner, options) {
  // Spec reporter
  Spec.call(this, runner, options);

  const watch = new TransactionWatcher(options.reporterOptions);

  runner.on('start', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    watch.initialize();
  });

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
