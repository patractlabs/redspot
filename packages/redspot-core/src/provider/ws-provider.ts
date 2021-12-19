// Copyright 2017-2021 @polkadot/rpc-provider authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable camelcase */

import { RpcCoder } from '@polkadot/rpc-provider/coder';
import defaults from '@polkadot/rpc-provider/defaults';
import { LRUCache } from '@polkadot/rpc-provider/lru';
import type {
  JsonRpcResponse,
  ProviderInterface,
  ProviderInterfaceCallback,
  ProviderInterfaceEmitCb,
  ProviderInterfaceEmitted
} from '@polkadot/rpc-provider/types';
import { getWSErrorString } from '@polkadot/rpc-provider/ws/errors';
import {
  assert,
  isChildClass,
  isNull,
  isNumber,
  isString,
  isUndefined,
  objectSpread
} from '@polkadot/util';
import { xglobal } from '@polkadot/x-global';
import { WebSocket } from '@polkadot/x-ws';
import chalk from 'chalk';
import EventEmitter from 'eventemitter3';
import log from '../logger';

interface SubscriptionHandler {
  callback: ProviderInterfaceCallback;
  type: string;
}

interface WsStateAwaiting {
  callback: ProviderInterfaceCallback;
  method: string;
  params: unknown[];
  subscription?: SubscriptionHandler;
}

interface WsStateSubscription extends SubscriptionHandler {
  method: string;
  params: unknown[];
}

const ALIASES: { [index: string]: string } = {
  chain_finalisedHead: 'chain_finalizedHead',
  chain_subscribeFinalisedHeads: 'chain_subscribeFinalizedHeads',
  chain_unsubscribeFinalisedHeads: 'chain_unsubscribeFinalizedHeads'
};

const RETRY_DELAY = 2500;

const MEGABYTE = 1024 * 1024;

function eraseRecord<T>(
  record: Record<string, T>,
  cb?: (item: T) => void
): void {
  Object.keys(record).forEach((key): void => {
    if (cb) {
      cb(record[key]);
    }

    delete record[key];
  });
}

function shortParams(result: any, len: number) {
  try {
    const str =
      isString(result) || isNumber(result)
        ? result.toString()
        : JSON.stringify(result);

    if (str.length > len + 3) {
      return `${str.substr(0, len)}...`;
    }

    return str;
  } catch {
    return '...';
  }
}

/**
 * _ @polkadot/rpc-provider/ws
 *
 * @name WsProvider
 *
 * @description The WebSocket Provider allows sending requests using WebSocket to a WebSocket RPC server TCP port. Unlike the [[HttpProvider]], it does support subscriptions and allows listening to events such as new blocks or balance changes.
 *
 * @example
 * <BR>
 *
 * ```javascript
 * import Api from '@polkadot/api/promise';
 * import { WsProvider } from '@polkadot/rpc-provider/ws';
 *
 * const provider = new WsProvider('ws://127.0.0.1:9944');
 * const api = new Api(provider);
 * ```
 *
 * @see [[HttpProvider]]
 */
export class WsProvider implements ProviderInterface {
  readonly _callCache = new LRUCache();

  readonly _coder: RpcCoder;

  readonly _endpoints: string[];

  readonly _headers: Record<string, string>;

  readonly _eventemitter: EventEmitter;

  readonly _handlers: Record<string, WsStateAwaiting> = {};

  readonly _isReadyPromise: Promise<WsProvider>;

  readonly _waitingForId: Record<string, JsonRpcResponse> = {};

  _autoConnectMs: number;

  _endpointIndex: number;

  _isConnected = false;

  _subscriptions: Record<string, WsStateSubscription> = {};

  _websocket: WebSocket | null;

  /**
   * @param {string | string[]}  endpoint    The endpoint url. Usually `ws://ip:9944` or `wss://ip:9944`, may provide an array of endpoint strings.
   * @param {boolean} autoConnect Whether to connect automatically or not.
   */
  constructor(
    endpoint: string | string[] = defaults.WS_URL,
    // autoConnectMs: number | false = RETRY_DELAY,
    headers: Record<string, string> = {}
  ) {
    const endpoints = Array.isArray(endpoint) ? endpoint : [endpoint];

    assert(endpoints.length !== 0, 'WsProvider requires at least one Endpoint');

    endpoints.forEach((endpoint) => {
      assert(
        /^(wss|ws):\/\//.test(endpoint),
        () => `Endpoint should start with 'ws://', received '${endpoint}'`
      );
    });

    this._eventemitter = new EventEmitter();
    // this._autoConnectMs = autoConnectMs || 0;
    this._coder = new RpcCoder();
    this._endpointIndex = -1;
    this._endpoints = endpoints;
    this._headers = headers;
    this._websocket = null;

    // if (autoConnectMs > 0) {
    //   this.connectWithRetry().catch((): void => {
    //     // does not throw
    //   });
    // }

    this._isReadyPromise = new Promise((resolve): void => {
      this._eventemitter.once('connected', (): void => {
        resolve(this);
      });
    });
  }

  /**
   * @summary `true` when this provider supports subscriptions
   */
  public get hasSubscriptions(): boolean {
    return true;
  }

  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */
  public get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * @description Promise that resolves the first time we are connected and loaded
   */
  public get isReady(): Promise<WsProvider> {
    return this._isReadyPromise;
  }

  /**
   * @description Returns a clone of the object
   */
  public clone(): WsProvider {
    return new WsProvider(this._endpoints);
  }

  /**
   * @summary Manually connect
   * @description The [[WsProvider]] connects automatically by default, however if you decided otherwise, you may
   * connect manually using this method.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async connect(): Promise<void> {
    try {
      this._endpointIndex = (this._endpointIndex + 1) % this._endpoints.length;
      this._websocket =
        typeof xglobal.WebSocket !== 'undefined' &&
        isChildClass(xglobal.WebSocket, WebSocket)
          ? new WebSocket(this._endpoints[this._endpointIndex])
          : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - WS may be an instance of w3cwebsocket, which supports headers
            new WebSocket(
              this._endpoints[this._endpointIndex],
              undefined,
              // @ts-ignore - WS may be an instance of w3cwebsocket, which supports headers
              undefined,
              this._headers,
              undefined,
              {
                // default: true
                fragmentOutgoingMessages: true,
                // default: 16K (bump, the Node has issues with too many fragments, e.g. on setCode)
                fragmentationThreshold: 1 * MEGABYTE,
                // default: 1MiB (also align with maxReceivedMessageSize)
                maxReceivedFrameSize: 24 * MEGABYTE,
                // default: 8MB (however Polkadot api.query.staking.erasStakers.entries(356) is over that, 16M is ok there)
                maxReceivedMessageSize: 24 * MEGABYTE
              }
            );

      this._websocket.onclose = this._onSocketClose;
      this._websocket.onerror = this._onSocketError;
      this._websocket.onmessage = this._onSocketMessage;
      this._websocket.onopen = this._onSocketOpen;

      return new Promise((resolve, reject) => {
        let isConnected = false;
        const eventemitter = this._eventemitter;

        function removeAll(event?) {
          eventemitter.removeListener('connected', onConnect);
          eventemitter.removeListener('disconnected', onClose);
          eventemitter.removeListener('error', onClose);

          if (isConnected) {
            resolve();
          } else {
            reject(event);
          }
        }

        function onConnect() {
          isConnected = true;
          removeAll();
        }

        function onClose(event) {
          isConnected = false;
          removeAll(event);
        }

        this._eventemitter.once('connected', onConnect);
        this._eventemitter.once('disconnected', onClose);
        this._eventemitter.once('error', onClose);
      });
    } catch (error) {
      log.error(chalk.red(error));

      this._emit('error', error);

      throw error;
    }
  }

  /**
   * @description Connect, never throwing an error, but rather forcing a retry
   */
  public async connectWithRetry(): Promise<void> {
    // if (this._autoConnectMs > 0) {
    try {
      await this.connect();
    } catch (error) {
      setTimeout((): void => {
        this.connectWithRetry().catch((): void => {
          // does not throw
        });
      }, this._autoConnectMs || RETRY_DELAY);
    }
    // }
  }

  /**
   * @description Manually disconnect from the connection, clearing auto-connect logic
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async disconnect(): Promise<void> {
    // switch off autoConnect, we are in manual mode now
    this._autoConnectMs = 0;

    try {
      if (this._websocket) {
        // 1000 - Normal closure; the connection successfully completed
        this._websocket.close(1000);
      }
    } catch (error) {
      log.error(chalk.red(error));

      this._emit('error', error);

      throw error;
    }
  }

  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   * @return unsubscribe function
   */
  public on(
    type: ProviderInterfaceEmitted,
    sub: ProviderInterfaceEmitCb
  ): () => void {
    this._eventemitter.on(type, sub);

    return (): void => {
      this._eventemitter.removeListener(type, sub);
    };
  }

  /**
   * @summary Send JSON data using WebSockets to configured HTTP Endpoint or queue.
   * @param method The RPC methods to execute
   * @param params Encoded parameters as applicable for the method
   * @param subscription Subscription details (internally used)
   */
  public send<T = any>(
    method: string,
    params: unknown[],
    isCacheable?: boolean,
    subscription?: SubscriptionHandler
  ): Promise<T> {
    const body = this._coder.encodeJson(method, params);
    let resultPromise: Promise<T> | null = isCacheable
      ? (this._callCache.get(body) as Promise<T>)
      : null;

    if (!resultPromise) {
      resultPromise = this._send(body, method, params, subscription);

      if (isCacheable) {
        this._callCache.set(body, resultPromise);
      }
    }

    return resultPromise;
  }

  async _send<T>(
    json: string,
    method: string,
    params: unknown[],
    subscription?: SubscriptionHandler
  ): Promise<T> {
    return new Promise<T>((resolve, reject): void => {
      try {
        assert(
          this.isConnected && !isNull(this._websocket),
          'WebSocket is not connected'
        );

        const id = this._coder.getId();

        const callback = (error?: Error | null, result?: T): void => {
          error ? reject(error) : resolve(result as T);
        };

        log.debug(
          `${chalk.green(`⬆`)} Id: ${chalk.bold(
            `%d`
          )}, method: ${method}, params: ${shortParams(params, 1000)}`,
          id
        );

        this._handlers[id] = {
          callback,
          method,
          params,
          subscription
        };

        this._websocket.send(json);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @name subscribe
   * @summary Allows subscribing to a specific event.
   *
   * @example
   * <BR>
   *
   * ```javascript
   * const provider = new WsProvider('ws://127.0.0.1:9944');
   * const rpc = new Rpc(provider);
   *
   * rpc.state.subscribeStorage([[storage.system.account, <Address>]], (_, values) => {
   *   console.log(values)
   * }).then((subscriptionId) => {
   *   console.log('balance changes subscription id: ', subscriptionId)
   * })
   * ```
   */
  public subscribe(
    type: string,
    method: string,
    params: unknown[],
    callback: ProviderInterfaceCallback
  ): Promise<number | string> {
    return this.send<number | string>(method, params, false, {
      callback,
      type
    });
  }

  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */
  public async unsubscribe(
    type: string,
    method: string,
    id: number | string
  ): Promise<boolean> {
    const subscription = `${type}::${id}`;

    // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // the assigned id now does not match what the API user originally received. It has
    // a slight complication in solving - since we cannot rely on the send id, but rather
    // need to find the actual subscription id to map it
    if (isUndefined(this._subscriptions[subscription])) {
      log.warn(`Unable to find active subscription=${subscription}`);

      return false;
    }

    delete this._subscriptions[subscription];

    try {
      return this.isConnected && !isNull(this._websocket)
        ? this.send<boolean>(method, [id])
        : true;
    } catch (error) {
      return false;
    }
  }

  _emit = (type: ProviderInterfaceEmitted, ...args: unknown[]): void => {
    this._eventemitter.emit(type, ...args);
  };

  _onSocketClose = (event: CloseEvent): void => {
    const error = new Error(
      `disconnected from ${this._endpoints[this._endpointIndex]}: ${
        event.code
      }:: ${event.reason || getWSErrorString(event.code)}`
    );

    if (this._autoConnectMs > 0) {
      log.error(chalk.red(error.message));
    }

    this._isConnected = false;

    if (this._websocket) {
      this._websocket.onclose = null;
      this._websocket.onerror = null;
      this._websocket.onmessage = null;
      this._websocket.onopen = null;
      this._websocket = null;
    }

    this._emit('disconnected');

    // reject all hanging requests
    eraseRecord(this._handlers, (h) => h.callback(error, undefined));
    eraseRecord(this._waitingForId);

    if (this._autoConnectMs > 0) {
      setTimeout((): void => {
        this.connectWithRetry().catch(() => {
          // does not throw
        });
      }, this._autoConnectMs);
    }
  };

  _onSocketError = (error: Event): void => {
    log.warn(`Socket event: ${error.type}`);
    this._emit('error', error);
  };

  _onSocketMessage = (message: MessageEvent<string>): void => {
    const response = JSON.parse(message.data as string) as JsonRpcResponse;
    const isMsg = isUndefined(response.method);

    if (isMsg) {
      log.debug(
        `${chalk.red('⬇')} Id: ${chalk.bold(`%d`)}, result: ${shortParams(
          response.result,
          60
        )}`,
        response.id
      );

      return this._onSocketMessageResult(response);
    } else {
      log.debug(
        `${chalk.red('⬇')} SubId: ${chalk.bold(
          response.params.subscription.toString()
        )}, result: ${shortParams(response.params.result, 60)}`
      );
      this._onSocketMessageSubscribe(response);
    }
  };

  _onSocketMessageResult = (response: JsonRpcResponse): void => {
    const handler = this._handlers[response.id];

    if (!handler) {
      return;
    }

    try {
      const { method, params, subscription } = handler;
      const result = this._coder.decodeResponse(response) as string;

      // first send the result - in case of subs, we may have an update
      // immediately if we have some queued results already
      handler.callback(null, result);

      if (subscription) {
        const subId = `${subscription.type}::${result}`;

        this._subscriptions[subId] = objectSpread({}, subscription, {
          method,
          params
        });

        // if we have a result waiting for this subscription already
        if (this._waitingForId[subId]) {
          this._onSocketMessageSubscribe(this._waitingForId[subId]);
        }
      }
    } catch (error) {
      handler.callback(error as Error, undefined);
    }

    delete this._handlers[response.id];
  };

  _onSocketMessageSubscribe = (response: JsonRpcResponse): void => {
    const method =
      ALIASES[response.method as string] || response.method || 'invalid';
    const subId = `${method}::${response.params.subscription}`;
    const handler = this._subscriptions[subId];

    if (!handler) {
      // store the JSON, we could have out-of-order subid coming in
      this._waitingForId[subId] = response;

      log.warn(`Unable to find handler for subscription=${subId}`);

      return;
    }

    // housekeeping
    delete this._waitingForId[subId];

    try {
      const result = this._coder.decodeResponse(response);

      handler.callback(null, result);
    } catch (error) {
      handler.callback(error as Error, undefined);
    }
  };

  _onSocketOpen = (): boolean => {
    assert(!isNull(this._websocket), 'WebSocket cannot be null in onOpen');

    log.info('Connected to', this._endpoints[this._endpointIndex]);

    this._isConnected = true;

    this._emit('connected');
    this._resubscribe();

    return true;
  };

  _resubscribe = (): void => {
    const subscriptions = this._subscriptions;

    this._subscriptions = {};

    Promise.all(
      Object.keys(subscriptions).map(
        async (id): Promise<void> => {
          const { callback, method, params, type } = subscriptions[id];

          // only re-create subscriptions which are not in author (only area where
          // transactions are created, i.e. submissions such as 'author_submitAndWatchExtrinsic'
          // are not included (and will not be re-broadcast)
          if (type.startsWith('author_')) {
            return;
          }

          try {
            await this.subscribe(type, method, params, callback);
          } catch (error) {
            log.error(error);
          }
        }
      )
    ).catch(log.error);
  };
}
