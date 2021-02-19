import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { RedspotConfig, InkConfig } from '../../types';
import semver from 'semver';

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

export function getResolvedWorkspace(findDir?: string): CargoMetadata {
  const execCommand = 'cargo metadata --no-deps --format-version 1';
  const findDirs = ['./'];

  if (findDir) {
    findDirs.push(findDir);
  }

  const cwd = findDirs.find((d) => fs.existsSync(path.join(d, 'Cargo.toml')));

  try {
    const output = execSync(execCommand, {
      maxBuffer: 1024 * 2048,
      cwd
    }).toString();

    const output_obj = JSON.parse(output);
    const versionData = execSync('cargo contract -V');
    const version = versionData.toString().split(' ')[1];

    if (semver.gte(version, '0.8.0')) {
      if (!output_obj.target_directory.endsWith('contracts/target/ink')) {
        output_obj.target_directory += '/ink';
      }
    }

    return output_obj;
  } catch (error) {
    throw new Error(chalk.red(`$ \`${execCommand}\` has failed`));
  }
}

export function filterContractPackage(metadata: CargoMetadata): CargoMetadata {
  const contracts = metadata.packages.filter(({ dependencies, id }) => {
    return (
      (metadata.workspace_members || []).includes(id) &&
      !!dependencies.find(({ name }: any) => name === 'ink_lang')
    );
  });

  return {
    ...metadata,
    packages: contracts
  };
}

export function getToolchain(config: RedspotConfig, toolchain?: string) {
  return toolchain || (config?.compiler as InkConfig)?.toolchain || 'nightly';
}
