import fsExtra from "fs-extra";
import * as path from "path";

import { Artifact } from "../types";

import { BuidlerError } from "./core/errors";
import { ERRORS } from "./core/errors-list";

function getArtifactPath(artifactsPath: string, contractName: string): string {
  return path.join(artifactsPath, `${contractName}.json`);
}

export async function saveArtifact(artifactsPath: string, paths: string[]) {
  for (const filepath of paths) {
    fsExtra.ensureDirSync(artifactsPath);
    fsExtra.copyFileSync(
      filepath,
      path.resolve(artifactsPath, path.basename(filepath))
    );
  }
}

/**
 * Asynchronically reads an artifact with the given `contractName` from the given `artifactPath`.
 *
 * @param artifactsPath the artifacts' directory.
 * @param contractName  the contract's name.
 */
export async function readArtifact(
  artifactsPath: string,
  contractName: string
): Promise<Artifact> {
  const artifactPath = getArtifactPath(artifactsPath, contractName);

  if (!fsExtra.pathExistsSync(artifactPath)) {
    throw new BuidlerError(ERRORS.ARTIFACTS.NOT_FOUND, { contractName });
  }

  return fsExtra.readJson(artifactPath);
}

/**
 * Synchronically reads an artifact with the given `contractName` from the given `artifactPath`.
 *
 * @param artifactsPath the artifacts directory.
 * @param contractName  the contract's name.
 */
export function readArtifactSync(
  artifactsPath: string,
  contractName: string
): Artifact {
  const artifactPath = getArtifactPath(artifactsPath, contractName);

  if (!fsExtra.pathExistsSync(artifactPath)) {
    throw new BuidlerError(ERRORS.ARTIFACTS.NOT_FOUND, { contractName });
  }

  return fsExtra.readJsonSync(artifactPath);
}
