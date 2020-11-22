import * as t from 'io-ts';
import { Context, getFunctionName, ValidationError } from 'io-ts/lib';
import { Reporter } from 'io-ts/lib/Reporter';
import { REDSPOT_NETWORK_NAME } from '../../constants';
import { RedspotError } from '../errors';
import { ERRORS } from '../errors-list';

function stringify(v: any): string {
  if (typeof v === 'function') {
    return getFunctionName(v);
  }

  if (typeof v === 'number' && !isFinite(v)) {
    if (isNaN(v)) {
      return 'NaN';
    }

    return v > 0 ? 'Infinity' : '-Infinity';
  }

  return JSON.stringify(v);
}

function getContextPath(context: Context): string {
  const keysPath = context
    .slice(1)
    .map((c) => c.key)
    .join('.');

  return `${context[0].type.name}.${keysPath}`;
}

function getMessage(e: ValidationError): string {
  const lastContext = e.context[e.context.length - 1];

  return e.message !== undefined
    ? e.message
    : getErrorMessage(
        getContextPath(e.context),
        e.value,
        lastContext.type.name
      );
}

function getErrorMessage(path: string, value: any, expectedType: string) {
  return `Invalid value ${stringify(
    value
  )} for ${path} - Expected a value of type ${expectedType}.`;
}

export function failure(es: ValidationError[]): string[] {
  return es.map(getMessage);
}

export function success(): string[] {
  return [];
}

export const DotPathReporter: Reporter<string[]> = {
  report: (validation) => validation.fold(failure, success)
};

function optional<TypeT, OutputT>(
  codec: t.Type<TypeT, OutputT, unknown>,
  name = `${codec.name} | undefined`
): t.Type<TypeT | undefined, OutputT | undefined, unknown> {
  return new t.Type(
    name,
    (u: unknown): u is TypeT | undefined => u === undefined || codec.is(u),
    (u, c) => (u === undefined ? t.success(u) : codec.validate(u, c)),
    (a) => (a === undefined ? undefined : codec.encode(a))
  );
}

const HEX_STRING_REGEX = /^(0x)?([0-9a-f]{2})+$/gi;

const HEX_PREFIX = '0x';

function isHexString(v: unknown): v is string {
  if (typeof v !== 'string') {
    return false;
  }

  return v.trim().match(HEX_STRING_REGEX) !== null;
}

export const hexString = new t.Type<string>(
  'hex string',
  isHexString,
  (u, c) => (isHexString(u) ? t.success(u) : t.failure(u, c)),
  t.identity
);

const commonHDAccountsFields = {
  initialIndex: optional(t.number),
  count: optional(t.number),
  path: optional(t.string)
};

const RedspotNetworkHDAccountsConfig = t.type({
  mnemonic: optional(t.string),
  accountsBalance: optional(t.string),
  ...commonHDAccountsFields
});

const NetworkConfigAccounts = t.array(t.string);

const HttpHeaders = t.record(t.string, t.string, 'httpHeaders');

const RedspotNetworkConfig = t.type({
  accounts: optional(NetworkConfigAccounts),
  gasLimit: optional(t.union([t.string, t.number])),
  from: optional(t.string),
  types: optional(t.record(t.string, t.unknown)),
  endpoint: optional(t.union([t.string, t.array(t.string)])),
  httpHeaders: optional(HttpHeaders),
  explorerUrl: optional(t.string)
});

const NetworkConfig = RedspotNetworkConfig;

const Networks = t.record(t.string, NetworkConfig);

const InkConfig = t.type({
  toolchain: optional(t.string)
});

const ProjectPaths = t.type({
  root: optional(t.string),
  cache: optional(t.string),
  artifacts: optional(t.string),
  sources: optional(t.string),
  tests: optional(t.string)
});

const RedspotConfig = t.type(
  {
    defaultNetwork: optional(t.string),
    ink: optional(InkConfig),
    networks: optional(Networks),
    paths: optional(ProjectPaths)
  },
  'RedspotConfig'
);

/**
 * Validates the config, throwing a RedspotError if invalid.
 * @param config
 */
export function validateConfig(config: any) {
  const errors = getValidationErrors(config);

  if (errors.length === 0) {
    return;
  }

  let errorList = errors.join('\n  * ');

  errorList = `  * ${errorList}`;

  throw new RedspotError(ERRORS.GENERAL.INVALID_CONFIG, { errors: errorList });
}

export function getValidationErrors(config: any): string[] {
  const errors = [];

  // These can't be validated with io-ts
  if (config !== undefined && typeof config.networks === 'object') {
    const redspotNetwork = config.networks[REDSPOT_NETWORK_NAME];

    if (redspotNetwork !== undefined) {
      if (typeof redspotNetwork.endpoint !== 'string') {
        errors.push(
          getErrorMessage(
            `RedspotConfig.networks.${redspotNetwork}.endpoint`,
            redspotNetwork.endpoint,
            'string'
          )
        );
      }
    }
  }

  // io-ts can get confused if there are errors that it can't understand.
  // Especially around Redspot Network's config. It will treat it as an HTTPConfig,
  // and may give a loot of errors.
  if (errors.length > 0) {
    return errors;
  }

  const result = RedspotConfig.decode(config);

  if (result.isRight()) {
    return errors;
  }

  const ioTsErrors = DotPathReporter.report(result);

  return [...errors, ...ioTsErrors];
}
