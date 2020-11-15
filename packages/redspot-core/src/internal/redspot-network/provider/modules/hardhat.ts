import * as t from 'io-ts';

import { CompilerInput, CompilerOutput } from '../../../../types';
import { MethodNotFoundError } from '../errors';
import {
  optionalRpcRedspotNetworkConfig,
  rpcAddress,
  rpcCompilerInput,
  rpcCompilerOutput,
  RpcRedspotNetworkConfig,
  validateParams
} from '../input';
import { RedspotNode } from '../node';
import { ForkConfig } from '../node-types';

// tslint:disable only-redspot-error

export class RedspotModule {
  constructor(
    private readonly _node: RedspotNode,
    private readonly _resetCallback: (forkConfig?: ForkConfig) => Promise<void>,
    private readonly _setLoggingEnabledCallback: (
      loggingEnabled: boolean
    ) => void
  ) {}

  public async processRequest(
    method: string,
    params: any[] = []
  ): Promise<any> {
    switch (method) {
      case 'redspot_getStackTraceFailuresCount':
        return this._getStackTraceFailuresCountAction(
          ...this._getStackTraceFailuresCountParams(params)
        );

      case 'redspot_addCompilationResult':
        return this._addCompilationResultAction(
          ...this._addCompilationResultParams(params)
        );

      case 'redspot_impersonateAccount':
        return this._impersonateAction(...this._impersonateParams(params));

      case 'redspot_stopImpersonatingAccount':
        return this._stopImpersonatingAction(
          ...this._stopImpersonatingParams(params)
        );

      case 'redspot_reset':
        return this._resetAction(...this._resetParams(params));

      case 'redspot_setLoggingEnabled':
        return this._setLoggingEnabledAction(
          ...this._setLoggingEnabledParams(params)
        );
    }

    throw new MethodNotFoundError(`Method ${method} not found`);
  }

  // redspot_getStackTraceFailuresCount

  private _getStackTraceFailuresCountParams(params: any[]): [] {
    return validateParams(params);
  }

  private async _getStackTraceFailuresCountAction(): Promise<number> {
    return this._node.getStackTraceFailuresCount();
  }

  // redspot_addCompilationResult

  private _addCompilationResultParams(
    params: any[]
  ): [string, CompilerInput, CompilerOutput] {
    return validateParams(
      params,
      t.string,
      rpcCompilerInput,
      rpcCompilerOutput
    );
  }

  private async _addCompilationResultAction(
    solcVersion: string,
    compilerInput: CompilerInput,
    compilerOutput: CompilerOutput
  ): Promise<boolean> {
    return this._node.addCompilationResult(
      solcVersion,
      compilerInput,
      compilerOutput
    );
  }

  // redspot_impersonateAccount

  private _impersonateParams(params: any[]): [Buffer] {
    return validateParams(params, rpcAddress);
  }

  private _impersonateAction(address: Buffer): true {
    return this._node.addImpersonatedAccount(address);
  }

  // redspot_stopImpersonatingAccount

  private _stopImpersonatingParams(params: any[]): [Buffer] {
    return validateParams(params, rpcAddress);
  }

  private _stopImpersonatingAction(address: Buffer): boolean {
    return this._node.removeImpersonatedAccount(address);
  }

  // redspot_reset

  private _resetParams(params: any[]): [RpcRedspotNetworkConfig | undefined] {
    return validateParams(params, optionalRpcRedspotNetworkConfig);
  }

  private async _resetAction(
    networkConfig?: RpcRedspotNetworkConfig
  ): Promise<true> {
    await this._resetCallback(networkConfig?.forking);
    return true;
  }

  // redspot_setLoggingEnabled

  private _setLoggingEnabledParams(params: any[]): [boolean] {
    return validateParams(params, t.boolean);
  }

  private async _setLoggingEnabledAction(
    loggingEnabled: boolean
  ): Promise<true> {
    this._setLoggingEnabledCallback(loggingEnabled);
    return true;
  }
}
