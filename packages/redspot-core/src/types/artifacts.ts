interface SpecDef {
  constructors: any[];
  docs: any[];
  events: any[];
  messages: {
    label: string;
    name: string[] | string;
    selector: string;
  }[];
}

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
  spec: SpecDef;
  V1: {
    spec: SpecDef;
  };
  V2: {
    spec: SpecDef;
  };
  V3: {
    spec: SpecDef;
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
