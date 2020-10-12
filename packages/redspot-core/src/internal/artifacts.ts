import fsExtra from "fs-extra";
import * as path from "path";
import { Artifact } from "../types";
import { BuidlerError } from "./core/errors";
import { ERRORS } from "./core/errors-list";

function getArtifactPath(
  artifactsPath: string,
  contractName: string,
  type: "abi" | "wasm" | "json"
): string {
  const extension = type === "wasm" ? "wasm" : "json";
  return path.join(artifactsPath, `${contractName}.${extension}`);
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

export async function readAbi(
  artifactsPath: string,
  contractName: string
): Promise<Artifact> {
  const artifactPath = getArtifactPath(artifactsPath, contractName, "abi");

  if (!fsExtra.pathExistsSync(artifactPath)) {
    throw new BuidlerError(ERRORS.ARTIFACTS.NOT_FOUND, { contractName });
  }

  return fsExtra.readJson(artifactPath);
}

export function readAbiSync(
  artifactsPath: string,
  contractName: string
): Artifact {
  const artifactPath = getArtifactPath(artifactsPath, contractName, "abi");

  if (!fsExtra.pathExistsSync(artifactPath)) {
    throw new BuidlerError(ERRORS.ARTIFACTS.NOT_FOUND, { contractName });
  }

  return fsExtra.readJsonSync(artifactPath);
}

export async function readWasm(
  artifactsPath: string,
  contractName: string
): Promise<string> {
  const artifactPath = getArtifactPath(artifactsPath, contractName, "wasm");

  if (!fsExtra.pathExistsSync(artifactPath)) {
    throw new BuidlerError(ERRORS.ARTIFACTS.NOT_FOUND, { contractName });
  }

  const buffer = await fsExtra.readFile(artifactPath);

  return buffer.toString("hex");
}

export function readWasmSync(
  artifactsPath: string,
  contractName: string
): string {
  const artifactPath = getArtifactPath(artifactsPath, contractName, "wasm");

  if (!fsExtra.pathExistsSync(artifactPath)) {
    throw new BuidlerError(ERRORS.ARTIFACTS.NOT_FOUND, { contractName });
  }

  return fsExtra.readFileSync(artifactPath).toString("hex");
}
