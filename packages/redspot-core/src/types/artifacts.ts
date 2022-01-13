export type AbiMetadata = {
  metadataVersion: string;
  source: {
    hash: string;
    language: string;
    compiler: string;
    wasm: string;
  };
  contract: {
    name: string;
    version: string;
    authors: string[];
  };
  V1?: {
    types: any[];
    spec: {
      constructors: any[];
      docs: any[];
      events: any[];
      messages: any[];
    };
  };
  V2?: {
    types: any[];
    spec: {
      constructors: any[];
      docs: any[];
      events: any[];
      messages: any[];
    };
  };
};

export interface Artifacts {
  readArtifact(contractNameOrFullyQualifiedName: string): Promise<AbiMetadata>;
  readArtifactSync(contractNameOrFullyQualifiedName: string): AbiMetadata;
  readAllArtifact(): Promise<AbiMetadata[]>;
  readAllArtifactSync(): AbiMetadata[];
  getArtifactPath(contractNameOrFullyQualifiedName: string): Promise<string>;
  getArtifactPathSync(contractNameOrFullyQualifiedName: string): string;
  artifactExists(contractNameOrFullyQualifiedName: string): Promise<boolean>;
  getArtifactPaths(): Promise<string[]>;
  copyToArtifactDir(paths: string[]): Promise<void>;
}
