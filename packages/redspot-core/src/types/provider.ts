import type { Signer } from '@polkadot/api/types';
import type { Keyring } from '@polkadot/keyring';
import type { KeyringPair, SignOptions } from '@polkadot/keyring/types';
import type { TypeRegistry } from '@polkadot/types';
import type BN from 'bn.js';
import type { RedspotNetworkAccountsUserConfig } from './config';

export interface AccountSigner extends Signer {
  readonly gasLimit?: BN;
  readonly pair: KeyringPair;
  readonly address: string;
  readonly addressRaw: Uint8Array;
  readonly publicKey: Uint8Array;
  getAddress(): Promise<string>;
  sign: (data: Uint8Array, options?: SignOptions) => Uint8Array;
}
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

export interface WsProvider {
  readonly hasSubscriptions: boolean;
  readonly isConnected: boolean;

  clone(): WsProvider;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  on(type: ProviderInterfaceEmitted, sub: ProviderInterfaceEmitCb): () => void;
  send(method: string, params: any[]): Promise<any>;
  subscribe(
    type: string,
    method: string,
    params: any[],
    cb: ProviderInterfaceCallback
  ): Promise<number | string>;
  unsubscribe(
    type: string,
    method: string,
    id: number | string
  ): Promise<boolean>;
}

export interface RpcProvider extends WsProvider {
  accounts: RedspotNetworkAccountsUserConfig;
  keyring: Keyring;
  gasLimit?: BN;
  registry: TypeRegistry;
  networkName: string;
  createSigner(keyringPair: KeyringPair): AccountSigner;
  getKeyringPairs(): Promise<KeyringPair[]>;
}
