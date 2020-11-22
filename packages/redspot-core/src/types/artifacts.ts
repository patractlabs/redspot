import type { ContractProject } from '@polkadot/types/interfaces';

export interface Artifacts {
  readArtifact(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<Artifact>;
  readArtifactSync(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Artifact;
  readArtifact(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<Artifact>;
  artifactExists(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<boolean>;
  getArtifactPaths(type: 'abi' | 'wasm' | 'json'): Promise<string[]>;
  saveArtifact(paths: string[]): Promise<void>;
}

export interface Artifact extends ContractProject {}
