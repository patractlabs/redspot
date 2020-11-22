import {
  ConfigExtender,
  ExperimentalRedspotNetworkMessageTraceHook,
  RedspotRuntimeEnvironment
} from '../types';

import { ExtenderManager } from './core/config/extenders';
import { assertRedspotInvariant, RedspotError } from './core/errors';
import { ERRORS } from './core/errors-list';
import { TasksDSL } from './core/tasks/dsl';
import { getRequireCachedFiles } from './util/platform';

export type GlobalWithRedspotContext = NodeJS.Global & {
  __redspotContext: RedspotContext;
};

export class RedspotContext {
  public static isCreated(): boolean {
    const globalWithRedspotContext = global as GlobalWithRedspotContext;

    return globalWithRedspotContext.__redspotContext !== undefined;
  }

  public static createRedspotContext(): RedspotContext {
    if (this.isCreated()) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_ALREADY_CREATED);
    }

    const globalWithRedspotContext = global as GlobalWithRedspotContext;
    const ctx = new RedspotContext();

    globalWithRedspotContext.__redspotContext = ctx;

    return ctx;
  }

  public static getRedspotContext(): RedspotContext {
    const globalWithRedspotContext = global as GlobalWithRedspotContext;
    const ctx = globalWithRedspotContext.__redspotContext;

    if (ctx === undefined) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_NOT_CREATED);
    }

    return ctx;
  }

  public static deleteRedspotContext() {
    const globalAsAny = global as any;

    globalAsAny.__redspotContext = undefined;
  }

  public readonly tasksDSL = new TasksDSL();
  public readonly extendersManager = new ExtenderManager();
  public environment?: RedspotRuntimeEnvironment;
  public readonly configExtenders: ConfigExtender[] = [];

  // NOTE: This is experimental and will be removed. Please contact our team if
  // you are planning to use it.
  public readonly experimentalRedspotNetworkMessageTraceHooks: ExperimentalRedspotNetworkMessageTraceHook[] = [];
  private _filesLoadedBeforeConfig?: string[];
  private _filesLoadedAfterConfig?: string[];

  public setRedspotRuntimeEnvironment(env: RedspotRuntimeEnvironment) {
    if (this.environment !== undefined) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_HRE_ALREADY_DEFINED);
    }

    this.environment = env;
  }

  public getRedspotRuntimeEnvironment(): RedspotRuntimeEnvironment {
    if (this.environment === undefined) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_HRE_NOT_DEFINED);
    }

    return this.environment;
  }

  public setConfigLoadingAsStarted() {
    this._filesLoadedBeforeConfig = getRequireCachedFiles();
  }

  public setConfigLoadingAsFinished() {
    this._filesLoadedAfterConfig = getRequireCachedFiles();
  }

  public getFilesLoadedDuringConfig(): string[] {
    // No config was loaded
    if (this._filesLoadedBeforeConfig === undefined) {
      return [];
    }

    assertRedspotInvariant(
      this._filesLoadedAfterConfig !== undefined,
      'Config loading was set as started and not finished'
    );

    return arraysDifference(
      this._filesLoadedAfterConfig,
      this._filesLoadedBeforeConfig
    );
  }
}

function arraysDifference<T>(a: T[], b: T[]): T[] {
  return a.filter((e) => !b.includes(e));
}
