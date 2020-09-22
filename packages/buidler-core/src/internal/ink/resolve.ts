import chalk from "chalk";
import { execSync } from "child_process";

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

export function getResolvedWorkspace(): CargoMetadata {
  const execCommand = "cargo metadata --no-deps --format-version 1";
  try {
    const output = execSync(execCommand, {
      maxBuffer: 1024 * 2048,
    }).toString();
    return JSON.parse(output);
  } catch (error) {
    throw new Error(chalk.red(`$ \`${execCommand}\` has failed`));
  }
}

export function filterContractPackage(metadata: CargoMetadata): CargoMetadata {
  const contracts = metadata.packages.filter(({ id, dependencies }) => {
    return (
      (metadata.workspace_members || []).includes(id) &&
      !!dependencies.find(({ name }: any) => name === "ink_core")
    );
  });

  return {
    ...metadata,
    packages: contracts,
  };
}
