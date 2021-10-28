import { WsProvider, Registry, AbiMetadata } from 'redspot/types';

export interface GasReporterConfig {
  provider: WsProvider;
  registry: Registry;
  enabled?: boolean;
  abis: AbiMetadata[];
}
