import { getClosestCallerPackage } from '../util/caller-package';
import { replaceAll } from '../util/strings';
import { ErrorDescriptor, ERRORS, getErrorCode } from './errors-list';

const inspect = Symbol.for('nodejs.util.inspect.custom');

export class CustomError extends Error {
  constructor(message: string, public readonly parent?: Error) {
    // WARNING: Using super when extending a builtin class doesn't work well
    // with TS if you are compiling to a version of JavaScript that doesn't have
    // native classes. We don't do that in Redspot.
    //
    // For more info about this, take a look at: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    super(message);

    this.name = this.constructor.name;

    // We do this to avoid including the constructor in the stack trace
    if ((Error as any).captureStackTrace !== undefined) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  public [inspect]() {
    let str = this.stack;

    if (this.parent !== undefined) {
      const parentAsAny = this.parent as any;
      const causeString =
        parentAsAny[inspect]?.() ??
        parentAsAny.inspect?.() ??
        parentAsAny.stack ??
        parentAsAny.toString();
      const nestedCauseStr = causeString
        .split('\n')
        .map((line: string) => `    ${line}`)
        .join('\n')
        .trim();

      str += `

    Caused by: ${nestedCauseStr}`;
    }

    return str;
  }
}

export class RedspotError extends CustomError {
  public static isRedspotError(other: any): other is RedspotError {
    return (
      other !== undefined && other !== null && other._isRedspotError === true
    );
  }

  public static isRedspotErrorType(
    other: any,
    descriptor: ErrorDescriptor
  ): other is RedspotError {
    return (
      RedspotError.isRedspotError(other) &&
      other.errorDescriptor.number === descriptor.number
    );
  }

  public readonly errorDescriptor: ErrorDescriptor;
  public readonly number: number;
  public readonly messageArguments: Record<string, any>;

  private readonly _isRedspotError: boolean;

  constructor(
    errorDescriptor: ErrorDescriptor,
    messageArguments: Record<string, any> = {},
    parentError?: Error
  ) {
    const prefix = `${getErrorCode(errorDescriptor)}: `;

    const formattedMessage = applyErrorMessageTemplate(
      errorDescriptor.message,
      messageArguments
    );

    super(prefix + formattedMessage, parentError);

    this.errorDescriptor = errorDescriptor;
    this.number = errorDescriptor.number;
    this.messageArguments = messageArguments;

    this._isRedspotError = true;
    Object.setPrototypeOf(this, RedspotError.prototype);
  }
}

/**
 * This class is used to throw errors from redspot plugins made by third parties.
 */
export class RedspotPluginError extends CustomError {
  public static isRedspotPluginError(other: any): other is RedspotPluginError {
    return (
      other !== undefined &&
      other !== null &&
      other._isRedspotPluginError === true
    );
  }

  public readonly pluginName: string;

  private readonly _isRedspotPluginError: boolean;

  /**
   * Creates a RedspotPluginError.
   *
   * @param pluginName The name of the plugin.
   * @param message An error message that will be shown to the user.
   * @param parent The error that causes this error to be thrown.
   */
  public constructor(pluginName: string, message: string, parent?: Error);

  /**
   * A DEPRECATED constructor that automatically obtains the caller package and
   * use it as plugin name.
   *
   * @deprecated Use the above constructor.
   *
   * @param message An error message that will be shown to the user.
   * @param parent The error that causes this error to be thrown.
   */
  public constructor(message: string, parent?: Error);

  public constructor(
    pluginNameOrMessage: string,
    messageOrParent?: string | Error,
    parent?: Error
  ) {
    if (typeof messageOrParent === 'string') {
      super(messageOrParent, parent);
      this.pluginName = pluginNameOrMessage;
    } else {
      super(pluginNameOrMessage, messageOrParent);
      this.pluginName = getClosestCallerPackage()!;
    }

    this._isRedspotPluginError = true;
    Object.setPrototypeOf(this, RedspotPluginError.prototype);
  }
}

export class NomicLabsRedspotPluginError extends RedspotPluginError {
  public static isNomicLabsRedspotPluginError(
    other: any
  ): other is NomicLabsRedspotPluginError {
    return (
      other !== undefined &&
      other !== null &&
      other._isNomicLabsRedspotPluginError === true
    );
  }

  private readonly _isNomicLabsRedspotPluginError: boolean;

  /**
   * This class is used to throw errors from *core* redspot plugins. If you are
   * developing a third-party plugin, use RedspotPluginError instead.
   */
  public constructor(
    pluginName: string,
    message: string,
    parent?: Error,
    public shouldBeReported = false
  ) {
    super(pluginName, message, parent);

    this._isNomicLabsRedspotPluginError = true;
    Object.setPrototypeOf(this, NomicLabsRedspotPluginError.prototype);
  }
}

/**
 * This function applies error messages templates like this:
 *
 *  - Template is a string which contains a variable tags. A variable tag is a
 *    a variable name surrounded by %. Eg: %plugin1%
 *  - A variable name is a string of alphanumeric ascii characters.
 *  - Every variable tag is replaced by its value.
 *  - %% is replaced by %.
 *  - Values can't contain variable tags.
 *  - If a variable is not present in the template, but present in the values
 *    object, an error is thrown.
 *
 * @param template The template string.
 * @param values A map of variable names to their values.
 */
export function applyErrorMessageTemplate(
  template: string,
  values: { [templateVar: string]: any }
): string {
  return _applyErrorMessageTemplate(template, values, false);
}

function _applyErrorMessageTemplate(
  template: string,
  values: { [templateVar: string]: any },
  isRecursiveCall: boolean
): string {
  if (!isRecursiveCall) {
    for (const variableName of Object.keys(values)) {
      if (variableName.match(/^[a-zA-Z][a-zA-Z0-9]*$/) === null) {
        throw new RedspotError(ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME, {
          variable: variableName
        });
      }

      const variableTag = `%${variableName}%`;

      if (!template.includes(variableTag)) {
        throw new RedspotError(ERRORS.INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING, {
          variable: variableName
        });
      }
    }
  }

  if (template.includes('%%')) {
    return template
      .split('%%')
      .map((part) => _applyErrorMessageTemplate(part, values, true))
      .join('%');
  }

  for (const variableName of Object.keys(values)) {
    let value: string;

    if (values[variableName] === undefined) {
      value = 'undefined';
    } else if (values[variableName] === null) {
      value = 'null';
    } else {
      value = values[variableName].toString();
    }

    if (value === undefined) {
      value = 'undefined';
    }

    const variableTag = `%${variableName}%`;

    if (value.match(/%([a-zA-Z][a-zA-Z0-9]*)?%/) !== null) {
      throw new RedspotError(
        ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG,
        { variable: variableName }
      );
    }

    template = replaceAll(template, variableTag, value);
  }

  return template;
}

export function assertRedspotInvariant(
  invariant: boolean,
  message: string
): asserts invariant {
  if (!invariant) {
    throw new RedspotError(ERRORS.GENERAL.ASSERTION_ERROR, { message });
  }
}
