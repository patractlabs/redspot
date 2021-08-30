import { task } from '../internal/core/config/config-env';
import { TASK_METADATA } from './task-names';

task(TASK_METADATA, 'Output the redspot config').setAction(
  async (_, { config }) => {
    console.log(JSON.stringify(config));
  }
);
