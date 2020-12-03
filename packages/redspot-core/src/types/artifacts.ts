import type { ContractProject } from '@polkadot/types/interfaces';

export type Artifact = ContractProject;
export interface Artifacts {
  getArtifactPath(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<string>;
  getArtifactPathSync(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): string;
  readAbi(contractNameOrFullyQualifiedName: string): Promise<Artifact>;
  readAbiSync(contractNameOrFullyQualifiedName: string): Artifact;
  readAbis(): Promise<Artifact[]>;
  readAbisSync(): Artifact[];
  readWasm(contractNameOrFullyQualifiedName: string): Promise<string>;
  readWasmSync(contractNameOrFullyQualifiedName: string): string;
  artifactExists(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<boolean>;
  getArtifactPaths(type: 'abi' | 'wasm' | 'json'): Promise<string[]>;
  saveArtifact(paths: string[]): Promise<void>;
}
