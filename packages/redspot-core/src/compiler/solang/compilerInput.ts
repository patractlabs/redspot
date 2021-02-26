import globby from 'globby';
import minimatch from 'minimatch';
import path from 'path';
import log from '../../logger';
import { SolangConfig } from '../../types';

export type SolangInput = {
  sources: string[];
};

export async function getCompilerInput(
  config: SolangConfig,
  patterns?: string[]
): Promise<SolangInput> {
  const files = await globby(patterns?.length ? patterns : config.sources, {
    onlyFiles: true,
    gitignore: true
  });

  const solPaths = files
    .filter((file) => minimatch(file, '*.sol', { matchBase: true }))
    .map((file) => path.resolve(file));

  log.log(`Solang: ${solPaths.length} matches`);

  return {
    sources: solPaths
  };
}
