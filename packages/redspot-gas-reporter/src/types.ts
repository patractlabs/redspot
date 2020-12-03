import { RpcProvider } from 'redspot/types';

export interface GasReporterConfig {
  provider: RpcProvider;
  enabled?: boolean;
  abis: any;
}
