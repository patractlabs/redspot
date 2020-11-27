import fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { Artifact, Artifacts as IArtifacts } from '../types';
import { RedspotError } from './core/errors';
import { ERRORS } from './core/errors-list';
import { glob, globSync } from './util/glob';

export class Artifacts implements IArtifacts {
  constructor(private _artifactsPath: string) {}

  public async readArtifact(
    name: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<Artifact> {
    const { trueCasePath } = await import('true-case-path');
    const artifactPath = await this._getArtifactPath(name, type);

    try {
      const trueCaseArtifactPath = await trueCasePath(
        path.relative(this._artifactsPath, artifactPath),
        this._artifactsPath
      );

      if (artifactPath !== trueCaseArtifactPath) {
        throw new RedspotError(ERRORS.ARTIFACTS.WRONG_CASING, {
          correct: trueCaseArtifactPath,
          incorrect: artifactPath
        });
      }

      return fsExtra.readJson(trueCaseArtifactPath);
    } catch (error) {
      if (
        typeof error.message === 'string' &&
        error.message.includes('no matching file exists')
      ) {
        throw new RedspotError(ERRORS.INTERNAL.WRONG_ARTIFACT_PATH, {
          contractName: name,
          artifactPath
        });
      }

      // tslint:disable-next-line only-redspot-error
      throw error;
    }
  }

  public readArtifactSync(
    name: string,
    type: 'abi' | 'wasm' | 'json'
  ): Artifact {
    const { trueCasePathSync } = require('true-case-path');
    const artifactPath = this._getArtifactPathSync(name, type);

    try {
      const trueCaseArtifactPath = trueCasePathSync(
        path.relative(this._artifactsPath, artifactPath),
        this._artifactsPath
      );

      if (artifactPath !== trueCaseArtifactPath) {
        throw new RedspotError(ERRORS.ARTIFACTS.WRONG_CASING, {
          correct: trueCaseArtifactPath,
          incorrect: artifactPath
        });
      }

      return fsExtra.readJsonSync(trueCaseArtifactPath);
    } catch (error) {
      if (
        typeof error.message === 'string' &&
        error.message.includes('no matching file exists')
      ) {
        throw new RedspotError(ERRORS.INTERNAL.WRONG_ARTIFACT_PATH, {
          contractName: name,
          artifactPath
        });
      }

      throw error;
    }
  }

  public async artifactExists(
    name: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<boolean> {
    try {
      await this.readArtifact(name, type);

      return true;
    } catch (e) {
      return false;
    }
  }

  public async getArtifactPaths(
    type: 'abi' | 'wasm' | 'json'
  ): Promise<string[]> {
    const extension = type === 'wasm' ? 'wasm' : 'json';
    const paths = await glob(
      path.join(this._artifactsPath, `**/*.${extension}`)
    );

    return paths.sort();
  }

  public async saveArtifact(paths: string[]): Promise<void> {
    for (const filepath of paths) {
      fsExtra.ensureDirSync(this._artifactsPath);
      fsExtra.copyFileSync(
        filepath,
        path.resolve(this._artifactsPath, path.basename(filepath))
      );
    }
  }

  private async _getArtifactPath(
    name: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<string> {
    const files = await this.getArtifactPaths(type);

    return this._getArtifactPathFromFiles(name, files, type);
  }

  private _getArtifactPathsSync(type: 'abi' | 'wasm' | 'json'): string[] {
    const extension = type === 'wasm' ? 'wasm' : 'json';

    return globSync(path.join(this._artifactsPath, `**/*.${extension}`));
  }

  private _getArtifactPathSync(
    name: string,
    type: 'abi' | 'wasm' | 'json'
  ): string {
    const files = this._getArtifactPathsSync(type);

    return this._getArtifactPathFromFiles(name, files, type);
  }

  private _getArtifactPathFromFiles(
    contractName: string,
    files: string[],
    type: 'abi' | 'wasm' | 'json'
  ): string {
    const extension = type === 'wasm' ? 'wasm' : 'json';

    const matchingFiles = files.filter((file) => {
      return path.basename(file) === `${contractName}.${extension}`;
    });

    if (matchingFiles.length === 0) {
      throw new RedspotError(ERRORS.ARTIFACTS.NOT_FOUND, {
        contractName
      });
    }

    if (matchingFiles.length > 1) {
      const candidates = matchingFiles.map(path.normalize);

      throw new RedspotError(ERRORS.ARTIFACTS.MULTIPLE_FOUND, {
        contractName,
        candidates: candidates.join(os.EOL)
      });
    }

    return matchingFiles[0];
  }
}
