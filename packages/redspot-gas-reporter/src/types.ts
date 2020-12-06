import { WsProvider, Registry } from 'redspot/types';

export interface GasReporterConfig {
  provider: WsProvider;
  registry: Registry;
  enabled?: boolean;
  abis: any;
}
