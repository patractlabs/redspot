import execa from 'execa';
import { task } from '../internal/core/config/config-env';
import { string } from '../internal/core/params/argumentTypes';
import { TASK_TESTNET } from './task-names';

const defaultCommand =
  'docker run -p 9944:9944 --rm redspot/contract /bin/bash -c "canvas --tmp --dev --ws-port=9944 --ws-external"';

export const runTestnet = (command: string) => {
  console.log(`$ ${command}`);
  console.log('run testnet');

  return execa.commandSync(command, {
    stdio: 'inherit',
    shell: true
  });
};

task(TASK_TESTNET, 'Running the test network')
  .addOptionalParam('command', 'Command to run the test net', undefined, string)
  .setAction(
    async (
      {
        command
      }: {
        command?: string;
      },
      { config }
    ) => {
      const runCommand =
        command || config.docker.runTestnet || !config.docker.sudo
          ? defaultCommand
          : `sudo ${defaultCommand}`;

      return runTestnet(runCommand);
    }
  );
