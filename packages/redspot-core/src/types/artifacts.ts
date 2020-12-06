import type { ContractProject } from '@polkadot/types/interfaces';

export type Abi = {
  metadataVersion: string;
  source: {
    hash: string;
    language: string;
    compiler: string;
  };
  contract: {
    name: string;
    version: string;
    authors: string[];
  };
  types: any[];
  spec: {
    constructors: any[];
    docs: any[];
    events: any[];
    messages: any[];
  };
};

export interface Artifacts {
  getArtifactPath(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<string>;
  getArtifactPathSync(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): string;
  readAbi(contractNameOrFullyQualifiedName: string): Promise<Abi>;
  readAbiSync(contractNameOrFullyQualifiedName: string): Abi;
  readAbis(): Promise<Abi[]>;
  readAbisSync(): Abi[];
  readWasm(contractNameOrFullyQualifiedName: string): Promise<string>;
  readWasmSync(contractNameOrFullyQualifiedName: string): string;
  artifactExists(
    contractNameOrFullyQualifiedName: string,
    type: 'abi' | 'wasm' | 'json'
  ): Promise<boolean>;
  getArtifactPaths(type: 'abi' | 'wasm' | 'json'): Promise<string[]>;
  saveArtifact(paths: string[]): Promise<void>;
}
