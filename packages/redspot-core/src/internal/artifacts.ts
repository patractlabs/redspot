import fsExtra from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { AbiMetadata, Artifacts as IArtifacts } from '../types';
import { RedspotError } from './core/errors';
import { ERRORS } from './core/errors-list';
import { glob, globSync } from './util/glob';

export class Artifacts implements IArtifacts {
  constructor(private _artifactsPath: string) {}

  public async getArtifactPath(name: string): Promise<string> {
    const { trueCasePath } = await import('true-case-path');
    const artifactPath = await this._getArtifactPath(name);

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

      return artifactPath;
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

  public getArtifactPathSync(name: string): string {
    const { trueCasePathSync } = require('true-case-path');
    const artifactPath = this._getArtifactPathSync(name);

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

      return trueCaseArtifactPath;
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

  public async readAllArtifact(): Promise<AbiMetadata[]> {
    const artifactPaths = await this.getArtifactPaths();

    return artifactPaths.map((path) => fsExtra.readJson(path) as any);
  }

  public readAllArtifactSync(): AbiMetadata[] {
    const artifactPaths = this._getArtifactPathsSync();

    return artifactPaths.map((path) => fsExtra.readJsonSync(path));
  }

  public async readArtifact(name: string): Promise<AbiMetadata> {
    const artifactPath = await this.getArtifactPath(name);

    return fsExtra.readJson(artifactPath);
  }

  public readArtifactSync(name: string): AbiMetadata {
    const artifactPath = this.getArtifactPathSync(name);

    return fsExtra.readJsonSync(artifactPath);
  }

  public async artifactExists(name: string): Promise<boolean> {
    try {
      await this.getArtifactPath(name);

      return true;
    } catch (e) {
      return false;
    }
  }

  public async getArtifactPaths(): Promise<string[]> {
    const paths = await glob(path.join(this._artifactsPath, `**/*.contract`));

    return paths.sort();
  }

  public async copyToArtifactDir(originPath: string[] | string): Promise<void> {
    const pathList = [].concat(originPath);

    for (const filepath of pathList) {
      fsExtra.ensureDirSync(this._artifactsPath);
      fsExtra.copyFileSync(
        filepath,
        path.resolve(this._artifactsPath, path.basename(filepath))
      );
    }
  }

  private async _getArtifactPath(name: string): Promise<string> {
    const files = await this.getArtifactPaths();

    return this._getArtifactPathFromFiles(name, files);
  }

  private _getArtifactPathsSync(): string[] {
    return globSync(path.join(this._artifactsPath, `**/*.contract`));
  }

  private _getArtifactPathSync(name: string): string {
    const files = this._getArtifactPathsSync();

    return this._getArtifactPathFromFiles(name, files);
  }

  private _getArtifactPathFromFiles(
    contractName: string,
    files: string[]
  ): string {
    const matchingFiles = files.filter((file) => {
      return path.basename(file) === `${contractName}.contract`;
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
