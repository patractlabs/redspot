import { ApiPromise as PolkadotApiPromise } from '@polkadot/api';
import type { Signer as PolkadotSigner } from '@polkadot/api/types';
import type { Keyring as PolkadotKeyring } from '@polkadot/keyring';
import type { KeyringPair as PolkadotKeyringPair } from '@polkadot/keyring/types';
import type { ProviderInterface } from '@polkadot/rpc-provider/types';
import type { Registry as PolkadotRegistry } from '@polkadot/types/types';

// eslint-disable-next-line  @typescript-eslint/no-empty-interface
export interface Keyring extends PolkadotKeyring {}

// eslint-disable-next-line  @typescript-eslint/no-empty-interface
export interface LocalKeyringPair extends PolkadotKeyringPair {
  suri?: string;
}

// eslint-disable-next-line  @typescript-eslint/no-empty-interface
export interface ApiPromise extends PolkadotApiPromise {}

// eslint-disable-next-line  @typescript-eslint/no-empty-interface
export interface Registry extends PolkadotRegistry {}

// eslint-disable-next-line  @typescript-eslint/no-empty-interface
export interface WsProvider extends ProviderInterface {}

export interface JsonRpcObject {
  id: number;
  jsonrpc: '2.0';
}

export interface JsonRpcRequest extends JsonRpcObject {
  method: string;
  params: unknown[];
}

export interface JsonRpcResponseBaseError {
  code: number;
  data?: number | string;
  message: string;
}

interface JsonRpcResponseSingle {
  error?: JsonRpcResponseBaseError;
  result?: unknown;
}

interface JsonRpcResponseSubscription {
  method?: string;
  params: {
    error?: JsonRpcResponseBaseError;
    result: unknown;
    subscription: number | string;
  };
}

export type JsonRpcResponseBase = JsonRpcResponseSingle &
  JsonRpcResponseSubscription;

export type JsonRpcResponse = JsonRpcObject & JsonRpcResponseBase;

export type ProviderInterfaceCallback = (
  error: Error | null,
  result: any
) => void;

export type ProviderInterfaceEmitted = 'connected' | 'disconnected' | 'error';

export type ProviderInterfaceEmitCb = (value?: any) => any;

export interface Signer extends PolkadotSigner {
  address: string;
  api: ApiPromise;
  pair: LocalKeyringPair;
}
