import 'redspot/types/config';

import { GasReporterConfig } from './types';

declare module 'redspot/types/config' {
  interface HardhatUserConfig {
    gasReporter?: Partial<GasReporterConfig>;
  }
}
