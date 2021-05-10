import { task } from 'redspot/config';
import chalk from 'chalk';
import { TASK_COMPILE } from 'redspot/builtin-tasks/task-names';
import { boolean } from 'redspot/internal/core/params/argumentTypes';
import { hashElement } from 'folder-hash';
import fs from 'fs-extra';

const options = {
  folders: {
    exclude: [
      'target',
      'node_modules',
      'artifacts',
      'tests',
      'scripts',
      '.yarn',
      '.cache'
    ]
  },
  files: { include: ['*.toml', '*.rs'] }
};

task(TASK_COMPILE)
  .addOptionalParam('quiet', 'Check for document changes', undefined, boolean)
  .setAction(
    async (
      {
        quiet
      }: {
        quiet?: boolean;
      },
      { config },
      runSuper
    ) => {
      const cacheFile = require('path').resolve(
        config.paths.cache,
        './watcherInfo'
      );
      let hash = {};

      let result = false;

      try {
        fs.ensureFileSync(cacheFile);

        hash = await hashElement('./', options);
      } catch {}

      if (quiet) {
        const json = fs.readJSONSync(cacheFile);

        result =
          JSON.stringify(hash, null, 0) === JSON.stringify(json, null, 0);

        if (result) {
          console.log(
            chalk.cyan('✔️ No file changes checked, skip compilation')
          );
        } else {
          await runSuper();
        }
      } else {
        await runSuper();
      }

      try {
        fs.writeJSONSync(cacheFile, hash);
      } catch (error) {}
    }
  );
