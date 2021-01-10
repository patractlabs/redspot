import { Compiler } from '../compiler/solang/compiler';
import { subtask } from '../internal/core/config/config-env';
import { TASK_COMPILE_SOLANG } from './task-names';

subtask(TASK_COMPILE_SOLANG, async (_, { config, run }) => {
  const compiler = new Compiler();

  return compiler.run(config.paths.sources, config.paths.artifacts);
});
