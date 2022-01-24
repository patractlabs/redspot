import { execSync } from 'child_process';
import globby from 'globby';
import minimatch from 'minimatch';
import { dirname } from 'path';
import { InkConfig } from '../../types';

/* eslint-disable camelcase */
export interface CargoPackage {
  name: string;
  version: string;
  id: string;
  license: null | string;
  license_file: null | string;
  description: null | string;
  source: null | string;
  dependencies: {
    name: string;
    source: string;
    req: string;
    kind: null | string;
    rename: null | string;
    optional: boolean;
    uses_default_features: boolean;
    features: any[];
    target: null | string;
    registry: null | string;
  }[];
  targets: any;
  features: any;
  manifest_path: string;
  metadata: any;
  publish: null | string[];
  authors: string[];
  categories: string[];
  keywords: string[];
  readme: null | string;
  repository: null | string;
  edition: string;
  links: null | string;
}

export interface CargoMetadata {
  packages: CargoPackage[];
  workspace_members: string[];
  resolve: any;
  target_directory: string;
  version: number;
  workspace_root: string;
  metadata: any;
}

export interface InkSource {
  id: string;
  name: string;
  manifestPath: string;
  targetDirectory: string;
}

export interface InkInput {
  sources: InkSource[];
  toolchain: string;
}

export function getCargoMetadata(
  config: InkConfig,
  cwd: string
): CargoMetadata {
  const execCommand = 'cargo metadata --no-deps --format-version 1';

  const output = execSync(execCommand, {
    maxBuffer: 1024 * 2048,
    cwd
  }).toString();

  const outputObj = JSON.parse(output);

  return outputObj;
}

export async function getCompilerInput(config: InkConfig, patterns?: string[]) {
  const files = await globby(
    patterns?.length ? patterns : config.sources || config.sources,
    {
      onlyFiles: true,
      gitignore: true
    }
  );

  const manifestPaths = files.filter((file) =>
    minimatch(file, 'Cargo.toml', { matchBase: true })
  );

  console.log(`ink: ${manifestPaths.length} matches`);

  const manifests = manifestPaths.map((path) => {
    return getCargoMetadata(config, dirname(path));
  });

  const input: Record<string, InkSource> = {};

  for (const manifest of manifests) {
    for (const packageInfo of manifest.packages) {
      if (
        packageInfo.dependencies.find(({ name }: any) => name === 'ink_lang')
      ) {
        input[packageInfo.manifest_path] = {
          id: packageInfo.id,
          name: packageInfo?.targets?.[0]?.name || packageInfo.name,
          manifestPath: packageInfo.manifest_path,
          targetDirectory: manifest.target_directory
        };
      }
    }
  }

  const sources = Object.values(input);

  return {
    sources,
    toolchain: config.toolchain
  };
}
