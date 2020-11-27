import { MessageTrace } from '../internal/redspot-network/stack-traces/message-trace';

import { RedspotRuntimeEnvironment } from './runtime';

// NOTE: This is experimental and will be removed. Please contact our team
// if you are planning to use it.
export type ExperimentalRedspotNetworkMessageTraceHook = (
  hre: RedspotRuntimeEnvironment,
  trace: MessageTrace,
  isMessageTraceFromACall: boolean
) => Promise<void>;

// NOTE: This is experimental and will be removed. Please contact our team
// if you are planning to use it.
export type BoundExperimentalRedspotNetworkMessageTraceHook = (
  trace: MessageTrace,
  isMessageTraceFromACall: boolean
) => Promise<void>;
