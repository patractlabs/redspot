import ProcessEnv = NodeJS.ProcessEnv;

import { RedspotArguments, RedspotParamDefinitions } from '../../../types';
import { ArgumentsParser } from '../../cli/ArgumentsParser';
import { unsafeObjectKeys } from '../../util/unsafe';
import { RedspotError } from '../errors';
import { ERRORS } from '../errors-list';

const REDSPOT_ENV_ARGUMENT_PREFIX = 'REDSPOT_';

export function paramNameToEnvVariable(paramName: string): string {
  // We create it starting from the result of ArgumentsParser.paramNameToCLA
  // so it's easier to explain and understand their equivalences.
  return ArgumentsParser.paramNameToCLA(paramName)
    .replace(ArgumentsParser.PARAM_PREFIX, REDSPOT_ENV_ARGUMENT_PREFIX)
    .replace(/-/g, '_')
    .toUpperCase();
}

export function getEnvVariablesMap(
  redspotArguments: RedspotArguments
): { [envVar: string]: string } {
  const values: { [envVar: string]: string } = {};

  for (const [name, value] of Object.entries(redspotArguments)) {
    if (value === undefined) {
      continue;
    }

    values[paramNameToEnvVariable(name)] = value.toString();
  }

  return values;
}

export function getEnvRedspotArguments(
  paramDefinitions: RedspotParamDefinitions,
  envVariables: ProcessEnv
): RedspotArguments {
  const envArgs: any = {};

  for (const paramName of unsafeObjectKeys(paramDefinitions)) {
    const definition = paramDefinitions[paramName];
    const envVarName = paramNameToEnvVariable(paramName);
    const rawValue = envVariables[envVarName];

    if (rawValue !== undefined) {
      try {
        envArgs[paramName] = definition.type.parse(paramName, rawValue);
      } catch (error) {
        throw new RedspotError(
          ERRORS.ARGUMENTS.INVALID_ENV_VAR_VALUE,
          {
            varName: envVarName,
            value: rawValue
          },
          error
        );
      }
    } else {
      envArgs[paramName] = definition.defaultValue;
    }
  }

  // TODO: This is a little type-unsafe, but we know we have all the needed arguments
  return envArgs as RedspotArguments;
}
