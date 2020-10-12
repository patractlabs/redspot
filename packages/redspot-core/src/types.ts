import { WsProvider } from "@polkadot/rpc-provider";
import { InkProject } from "@polkadot/types/interfaces";
import { DeepReadonly } from "ts-essentials";
import * as types from "./internal/core/params/argumentTypes";

// Begin config types

// IMPORTANT: This t.types MUST be kept in sync with the actual types.
export interface CommonNetworkConfig {
  accounts?: NetworkConfigAccounts;
  gasLimit?: string | number;
  endowment?: string | number;
  types?: Record<string, any>;
  from?: string;
}

export interface RedspotNetworkAccount {
  privateKey: string;
  balance: string;
}

export type NetworkConfigAccounts = string[];

export interface WsNetworkConfig extends CommonNetworkConfig {
  endpoint?: string | string[];
  autoConnectMs?: number | false;
  httpHeaders?: Record<string, string>;
}

export type NetworkConfig = WsNetworkConfig;

export interface Networks {
  [networkName: string]: NetworkConfig;
}

/**
 * The project paths:
 * * root: the project's root.
 * * configFile: the redspot's config filepath.
 * * cache: project's cache directory.
 * * artifacts: artifact's directory.
 * * sources: project's sources directory.
 * * tests: project's tests directory.
 */
export interface ProjectPaths {
  root: string;
  configFile: string;
  cache: string;
  artifacts: string;
  sources: string;
  tests: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
}

export interface RedspotConfig {
  defaultNetwork?: string;
  networks?: Networks;
  paths?: Partial<ProjectPaths>;
  mocha?: Mocha.MochaOptions;
  analytics?: Partial<AnalyticsConfig>;
}

export interface ResolvedRedspotConfig extends RedspotConfig {
  defaultNetwork: string;
  paths: ProjectPaths;
  networks: Networks;
  analytics: AnalyticsConfig;
}

/**
 * A function that receives a RedspotRuntimeEnvironment and
 * modify its properties or add new ones.
 */
export type EnvironmentExtender = (env: RedspotRuntimeEnvironment) => void;

export type ConfigExtender = (
  config: ResolvedRedspotConfig,
  userConfig: DeepReadonly<RedspotConfig>
) => void;

export interface TasksMap {
  [name: string]: TaskDefinition;
}

export interface ConfigurableTaskDefinition {
  setDescription(description: string): this;

  setAction(action: ActionType<TaskArguments>): this;

  addParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>,
    isOptional?: boolean
  ): this;

  addOptionalParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>
  ): this;

  addPositionalParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>,
    isOptional?: boolean
  ): this;

  addOptionalPositionalParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>
  ): this;

  addVariadicPositionalParam<T>(
    name: string,
    description?: string,
    defaultValue?: T[],
    type?: types.ArgumentType<T>,
    isOptional?: boolean
  ): this;

  addOptionalVariadicPositionalParam<T>(
    name: string,
    description?: string,
    defaultValue?: T[],
    type?: types.ArgumentType<T>
  ): this;

  addFlag(name: string, description?: string): this;
}

export interface ParamDefinition<T> {
  name: string;
  defaultValue?: T;
  type: types.ArgumentType<T>;
  description?: string;
  isOptional: boolean;
  isFlag: boolean;
  isVariadic: boolean;
}

export interface OptionalParamDefinition<T> extends ParamDefinition<T> {
  defaultValue: T;
  isOptional: true;
}

export interface ParamDefinitionsMap {
  [paramName: string]: ParamDefinition<any>;
}

/**
 * Redspot arguments:
 * * network: the network to be used.
 * * showStackTraces: flag to show stack traces.
 * * version: flag to show redspot's version.
 * * help: flag to show redspot's help message.
 * * config: used to specify redspot's config file.
 */
export interface RedspotArguments {
  network?: string;
  showStackTraces: boolean;
  version: boolean;
  help: boolean;
  config?: string;
  verbose: boolean;
  maxMemory?: number;
}

export type RedspotParamDefinitions = {
  [param in keyof Required<RedspotArguments>]: OptionalParamDefinition<
    RedspotArguments[param]
  >;
};

export interface TaskDefinition extends ConfigurableTaskDefinition {
  readonly name: string;
  readonly description?: string;
  readonly action: ActionType<TaskArguments>;
  readonly isInternal: boolean;

  // TODO: Rename this to something better. It doesn't include the positional
  // params, and that's not clear.
  readonly paramDefinitions: ParamDefinitionsMap;

  readonly positionalParamDefinitions: Array<ParamDefinition<any>>;
}

/**
 * @type TaskArguments {object-like} - the input arguments for a task.
 *
 * TaskArguments type is set to 'any' because it's interface is dynamic.
 * It's impossible in TypeScript to statically specify a variadic
 * number of fields and at the same time define specific types for\
 * the argument values.
 *
 * For example, we could define:
 * type TaskArguments = Record<string, any>;
 *
 * ...but then, we couldn't narrow the actual argument value's type in compile time,
 * thus we have no other option than forcing it to be just 'any'.
 */
export type TaskArguments = any;

export type RunTaskFunction = (
  name: string,
  taskArguments?: TaskArguments
) => Promise<any>;

export interface RunSuperFunction<ArgT extends TaskArguments> {
  (taskArguments?: ArgT): Promise<any>;
  isDefined: boolean;
}

export type ActionType<ArgsT extends TaskArguments> = (
  taskArgs: ArgsT,
  env: RedspotRuntimeEnvironment,
  runSuper: RunSuperFunction<ArgsT>
) => Promise<any>;

export interface NetworkProvider extends WsProvider {
  accounts: NetworkConfigAccounts;
  endowment: string | number;
  gasLimit: string | number;
  networkName: string;
  types: Record<string, any>;
}

export type INetworkProvider = NetworkProvider;

export interface Network {
  name: string;
  config: NetworkConfig;
  provider: NetworkProvider;
}

export interface RedspotRuntimeEnvironment {
  readonly config: ResolvedRedspotConfig;
  readonly redspotArguments: RedspotArguments;
  readonly tasks: TasksMap;
  readonly run: RunTaskFunction;
  readonly network: Network;
}

export interface Artifact extends InkProject {}

export interface LinkReferences {
  [libraryFileName: string]: {
    [libraryName: string]: Array<{ length: number; start: number }>;
  };
}
