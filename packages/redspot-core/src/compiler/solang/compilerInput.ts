import globby from 'globby';
import { SolangConfig } from '../../types';
import minimatch from 'minimatch';
import path from 'path';

export type SolangInput = {
  sources: string[];
};

export async function getCompilerInput(
  config: SolangConfig
): Promise<SolangInput> {
  const files = await globby(config.sources, {
    onlyFiles: true,
    gitignore: true
  });

  const solPaths = files
    .filter((file) => minimatch(file, '*.sol', { matchBase: true }))
    .map((file) => path.resolve(file));

  return {
    sources: solPaths
  };
}
