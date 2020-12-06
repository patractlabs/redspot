import {
  isChildClass,
  isNull,
  isNumber,
  isString,
  isUndefined
} from '@polkadot/util';
import WS from '@polkadot/x-ws';
import assert from 'assert';
import chalk from 'chalk';
import EventEmitter from 'eventemitter3';
import log from '../logger';
import {
  JsonRpcResponse,
  ProviderInterfaceCallback,
  ProviderInterfaceEmitCb,
  ProviderInterfaceEmitted,
  WsProvider as IWsProvider
} from '../types';
import Coder from './coder';
import { getWSErrorString } from './errors';

interface SubscriptionHandler {
  callback: ProviderInterfaceCallback;
  type: string;
}

interface WsStateAwaiting {
  callback: ProviderInterfaceCallback;
  method: string;
  params: any[];
  subscription?: SubscriptionHandler;
}

interface WsStateSubscription extends SubscriptionHandler {
  method: string;
  params: any[];
}

const ALIASSES: { [index: string]: string } = {
  chain_finalisedHead: 'chain_finalizedHead',
  chain_subscribeFinalisedHeads: 'chain_subscribeFinalizedHeads',
  chain_unsubscribeFinalisedHeads: 'chain_unsubscribeFinalizedHeads'
};

const RETRY_DELAY = 1000;

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
 * @name WsProvider
 *
 * @description The WebSocket Provider allows sending requests using WebSocket to a WebSocket RPC server TCP port. Unlike the [[HttpProvider]], it does support subscriptions and allows listening to events such as new blocks or balance changes.
 *
 * @see [[HttpProvider]]
 */
export class WsProvider implements IWsProvider {
  readonly _coder: Coder;

  readonly _endpoints: string[];

  readonly _headers: Record<string, string>;

  readonly _eventemitter: EventEmitter;

  readonly _handlers: Record<string, WsStateAwaiting> = {};

  readonly _queued: Record<string, string> = {};

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
    endpoint: string | string[],
    headers: Record<string, string> = {}
  ) {
    const endpoints = Array.isArray(endpoint) ? endpoint : [endpoint];

    assert(endpoints.length !== 0, 'WsProvider requires at least one Endpoint');

    endpoints.forEach((endpoint) => {
      assert(
        /^(wss|ws):\/\//.test(endpoint),
        `Endpoint should start with 'ws://', received '${endpoint}'`
      );
    });

    this._eventemitter = new EventEmitter();
    this._coder = new Coder();
    this._endpointIndex = -1;
    this._endpoints = endpoints;
    this._headers = headers;
    this._websocket = null;
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
   * @description Returns a clone of the object
   */
  public clone(): WsProvider {
    return new WsProvider(this._endpoints, this._headers);
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
        typeof WebSocket !== 'undefined' && isChildClass(WebSocket, WS)
          ? new WS(this._endpoints[this._endpointIndex])
          : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // WS may be an instance of w3cwebsocket, which supports headers
            new (WS as any)(
              this._endpoints[this._endpointIndex],
              undefined,
              undefined,
              this._headers
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
    try {
      await this.connect();
    } catch (error) {
      setTimeout((): void => {
        this.connectWithRetry().catch((): void => {
          // does not throw
        });
      }, this._autoConnectMs || RETRY_DELAY);
    }
  }

  /**
   * @description Manually disconnect from the connection, clearing autoconnect logic
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async disconnect(): Promise<void> {
    try {
      assert(
        !isNull(this._websocket),
        'Cannot disconnect on a non-connected websocket'
      );

      // switch off autoConnect, we are in manual mode now
      this._autoConnectMs = 0;

      // 1000 - Normal closure; the connection successfully completed
      this._websocket.close(1000);
      this._websocket = null;
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
   * @param params Encoded paramaters as appliucable for the method
   * @param subscription Subscription details (internally used)
   */
  public send(
    method: string,
    params: any[],
    subscription?: SubscriptionHandler
  ): Promise<any> {
    return new Promise((resolve, reject): void => {
      try {
        const json = this._coder.encodeJson(method, params);
        const request = JSON.stringify(json);
        const id = this._coder.getId();

        const callback = (error?: Error | null, result?: any): void => {
          error ? reject(error) : resolve(result);
        };

        log.debug(
          `${chalk.green(`⬆`)} Id: ${chalk.bold(`%d`)}, method: ${
            json.method
          }, params: ${shortParams(json.params, 1000)}`,
          json.id
        );

        this._handlers[id] = {
          callback,
          method,
          params,
          subscription
        };

        if (this.isConnected && !isNull(this._websocket)) {
          this._websocket.send(request);
        } else {
          this._queued[id] = request;
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @name subscribe
   * @summary Allows subscribing to a specific event.
   * @param  {string}                     type     Subscription type
   * @param  {string}                     method   Subscription method
   * @param  {any[]}                 params   Parameters
   * @param  {ProviderInterfaceCallback} callback Callback
   * @return {Promise<number>}                     Promise resolving to the dd of the subscription you can use with [[unsubscribe]].
   */
  public async subscribe(
    type: string,
    method: string,
    params: any[],
    callback: ProviderInterfaceCallback
  ): Promise<number | string> {
    const id = (await this.send(method, params, { callback, type })) as Promise<
      number | string
    >;

    return id;
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

    const result = (await this.send(method, [id])) as Promise<boolean>;

    return result;
  }

  _emit = (type: ProviderInterfaceEmitted, ...args: any[]): void => {
    this._eventemitter.emit(type, ...args);
  };

  _onSocketClose = (event: CloseEvent): void => {
    const ms = event.reason || getWSErrorString(event.code);

    if (ms.trim() !== 'Normal connection closure') {
      log.error(
        chalk.red(
          `Disconnected from ${this._endpoints[this._endpointIndex]}: ${
            event.code
          }:: ${event.reason || getWSErrorString(event.code)}`
        )
      );
    }

    this._isConnected = false;
    this._emit('disconnected');
  };

  _onSocketError = (error: Event): void => {
    log.warn(`Socket event: ${error.type}`);
    this._emit('error', error);
  };

  _onSocketMessage = (message: MessageEvent): void => {
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
      // log.warn(`Unable to find handler for id=${response.id}`);

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

        this._subscriptions[subId] = {
          ...subscription,
          method,
          params
        };

        // if we have a result waiting for this subscription already
        if (this._waitingForId[subId]) {
          this._onSocketMessageSubscribe(this._waitingForId[subId]);
        }
      }
    } catch (error) {
      handler.callback(error, undefined);
    }

    delete this._handlers[response.id];
  };

  _onSocketMessageSubscribe = (response: JsonRpcResponse): void => {
    const method = ALIASSES[response.method] || response.method || 'invalid';
    const subId = `${method}::${response.params.subscription}`;
    const handler = this._subscriptions[subId];

    if (!handler) {
      // store the JSON, we could have out-of-order subid coming in
      this._waitingForId[subId] = response;

      // log.warn(`Unable to find handler for subscription=${subId}`);

      return;
    }

    // housekeeping
    delete this._waitingForId[subId];

    try {
      const result = this._coder.decodeResponse(response);

      handler.callback(null, result);
    } catch (error) {
      handler.callback(error, undefined);
    }
  };

  _onSocketOpen = (): boolean => {
    assert(!isNull(this._websocket), 'WebSocket cannot be null in onOpen');

    log.info('Connected to', this._endpoints[this._endpointIndex]);

    this._isConnected = true;

    this._emit('connected');
    this._sendQueue();
    this._resubscribe();

    return true;
  };

  _resubscribe = (): void => {
    const subscriptions = this._subscriptions;

    this._subscriptions = {};

    Object.keys(subscriptions).forEach(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
          log.error(chalk.red(error));
        }
      }
    );
  };

  _sendQueue = (): void => {
    Object.keys(this._queued).forEach((id): void => {
      try {
        // we have done the websocket check in onSocketOpen, if an issue, will catch it
        this._websocket.send(this._queued[id]);

        delete this._queued[id];
      } catch (error) {
        log.error(chalk.red(error));
      }
    });
  };
}
