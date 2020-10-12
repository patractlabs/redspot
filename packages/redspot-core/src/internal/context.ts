import { RedspotRuntimeEnvironment, ConfigExtender } from "../types";
import { ExtenderManager } from "./core/config/extenders";
import { RedspotError } from "./core/errors";
import { ERRORS } from "./core/errors-list";
import { TasksDSL } from "./core/tasks/dsl";

export type GlobalWithRedspotContext = NodeJS.Global & {
  __redspotContext: RedspotContext;
};

export class RedspotContext {
  public static isCreated(): boolean {
    const globalWithRedspotContext = (global as any) as GlobalWithRedspotContext;
    return globalWithRedspotContext.__redspotContext !== undefined;
  }

  public static createRedspotContext(): RedspotContext {
    if (this.isCreated()) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_ALREADY_CREATED);
    }
    const globalWithRedspotContext = (global as any) as GlobalWithRedspotContext;
    const ctx = new RedspotContext();
    globalWithRedspotContext.__redspotContext = ctx;
    return ctx;
  }

  public static getRedspotContext(): RedspotContext {
    const globalWithRedspotContext = (global as any) as GlobalWithRedspotContext;
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
  public readonly loadedPlugins: string[] = [];
  public readonly configExtenders: ConfigExtender[] = [];

  private _configPath?: string;

  public setRedspotRuntimeEnvironment(env: RedspotRuntimeEnvironment) {
    if (this.environment !== undefined) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_RSE_ALREADY_DEFINED);
    }
    this.environment = env;
  }

  public getRedspotRuntimeEnvironment(): RedspotRuntimeEnvironment {
    if (this.environment === undefined) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_RSE_NOT_DEFINED);
    }
    return this.environment;
  }

  public setPluginAsLoaded(pluginName: string) {
    this.loadedPlugins.push(pluginName);
  }

  public setConfigPath(configPath: string) {
    this._configPath = configPath;
  }

  public getConfigPath(): string {
    if (this._configPath === undefined) {
      throw new RedspotError(ERRORS.GENERAL.CONTEXT_CONFIG_PATH_NOT_SET);
    }

    return this._configPath;
  }
}
