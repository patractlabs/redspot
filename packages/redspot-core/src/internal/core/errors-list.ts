export const ERROR_PREFIX = "RDST";

export interface ErrorDescriptor {
  number: number;
  // Message can use templates. See applyErrorMessageTemplate
  message: string;
  // Title and description can be Markdown
  title: string;
  description: string;
  shouldBeReported: boolean;
}

export function getErrorCode(error: ErrorDescriptor): string {
  return `${ERROR_PREFIX}${error.number}`;
}

export const ERROR_RANGES = {
  GENERAL: { min: 0, max: 99, title: "General errors" },
  NETWORK: { min: 100, max: 199, title: "Network related errors" },
  TASK_DEFINITIONS: {
    min: 200,
    max: 299,
    title: "Task definition errors",
  },
  ARGUMENTS: { min: 300, max: 399, title: "Arguments related errors" },
  RESOLVER: {
    min: 400,
    max: 499,
    title: "Dependencies resolution errors",
  },
  BUILTIN_TASKS: { min: 500, max: 599, title: "Built-in tasks errors" },
  ARTIFACTS: { min: 600, max: 699, title: "Artifacts related errors" },
  PLUGINS: { min: 700, max: 799, title: "Plugin system errors" },
  INTERNAL: { min: 800, max: 899, title: "Internal Redspot errors" },
};

export const ERRORS: {
  [category in keyof typeof ERROR_RANGES]: {
    [errorName: string]: ErrorDescriptor;
  };
} = {
  GENERAL: {
    NOT_INSIDE_PROJECT: {
      number: 1,
      message: "You are not inside a Redspot project.",
      title: "You are not inside a Redspot project",
      description: `You are trying to run Redspot outside of a Redspot project.`,
      shouldBeReported: false,
    },
    INVALID_NODE_VERSION: {
      number: 2,
      message:
        "Redspot doesn't support your Node.js version. It should be %requirement%.",
      title: "Unsupported Node.js",
      description: `Redspot doesn't support your Node.js version.

Please upgrade your version of Node.js and try again.`,
      shouldBeReported: false,
    },
    UNSUPPORTED_OPERATION: {
      number: 3,
      message: "%operation% is not supported in Redspot.",
      title: "Unsupported operation",
      description: `You are tying to perform an unsupported operation.

Unless you are creating a task or plugin, this is probably a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    CONTEXT_ALREADY_CREATED: {
      number: 4,
      message: "RedspotContext is already created.",
      title: "Redspot was already initialized",
      description: `Redspot initialization was executed twice. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    CONTEXT_NOT_CREATED: {
      number: 5,
      message: "RedspotContext is not created.",
      title: "Redspot wasn't initialized",
      description: `Redspot initialization failed. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    CONTEXT_RSE_NOT_DEFINED: {
      number: 6,
      message:
        "Redspot Runtime Environment is not defined in the RedspotContext.",
      title: "Redspot Runtime Environment not created",
      description: `Redspot initialization failed. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    CONTEXT_RSE_ALREADY_DEFINED: {
      number: 7,
      message:
        "Redspot Runtime Environment is already defined in the RedspotContext",
      title: "Tried to create the Redspot Runtime Environment twice",
      description: `The Redspot initialization process was executed twice. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    INVALID_CONFIG: {
      number: 8,
      message: `There's one or more errors in your config file:

%errors%

To learn more about Redspot's configuration, please go to https://github.com/patractlabs/redspot-0.2`,
      title: "Invalid Redspot config",
      description: `You have one or more errors in your config file.

Check the error message for details, or go to [documentation](https://github.com/patractlabs/redspot-0.2) to learn more.`,
      shouldBeReported: false,
    },
    LIB_IMPORTED_FROM_THE_CONFIG: {
      number: 9,
      message: `Error while loading Redspot's configuration.
You probably imported redspot instead of redspot/config`,
      title: "Failed to load config file",
      description: `There was an error while loading your config file.

The most common source of errors is trying to import \`redspot\` instead of \`redspot/config\`.

Please make sure your config file is correct.`,
      shouldBeReported: false,
    },
    USER_CONFIG_MODIFIED: {
      number: 10,
      message: `Error while loading Redspot's configuration.
You or one of your plugins is trying to modify the userConfig.%path% value from a config extender`,
      title: "Attempted to modify the user's config",
      description: `An attempt to modify the user's config was made.

This is probably a bug in one of your plugins.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    CONTEXT_CONFIG_PATH_NOT_SET: {
      number: 11,
      message:
        "Trying to access the RedspotContext's config path field but it wasn't set",
      title: "RedspotContext's config path not defined",
      description: `The Redspot initialization process was incomplete. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    BAD_SURI: {
      number: 12,
      message: `Can't parse suri "%uri%"`,
      title: "BAD SURI",
      description: `The account cannot be imported from this suri.

Please check that the configured accounts are correct.`,
      shouldBeReported: false,
    },
    BAD_KEYPAIR: {
      number: 13,
      message: `Cannot import keypair`,
      title: "BAD KEYPAIR",
      description: `The keypair cannot be imported.

Please check that the configured keypair are correct.`,
      shouldBeReported: false,
    },
  },
  NETWORK: {
    CONFIG_NOT_FOUND: {
      number: 100,
      message: "Network %network% doesn't exist",
      title: "Selected network doesn't exist",
      description: `You are trying to run Redspot with a non-existent network.`,
      shouldBeReported: false,
    },
    INVALID_JSON_RESPONSE: {
      number: 101,
      message: "Invalid JSON-RPC response received: %response%",
      title: "Invalid JSON-RPC response",
      description: `One of your JSON-RPC requests received an invalid response.

Please make sure your node is running, and check your internet connection and networks config.`,
      shouldBeReported: false,
    },
  },
  TASK_DEFINITIONS: {
    PARAM_AFTER_VARIADIC: {
      number: 200,
      message:
        "Could not set positional param %paramName% for task %taskName% because there is already a variadic positional param and it has to be the last positional one.",
      title: "Could not add positional param",
      description: `Could add a positional param to your task because
there is already a variadic positional param and it has to be the last
positional one.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    PARAM_ALREADY_DEFINED: {
      number: 201,
      message:
        "Could not set param %paramName% for task %taskName% because its name is already used.",
      title: "Repeated param name",
      description: `Could not add a param to your task because its name is already used.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    PARAM_CLASHES_WITH_REDSPOT_PARAM: {
      number: 202,
      message:
        "Could not set param %paramName% for task %taskName% because its name is used as a param for Redspot.",
      title: "Redspot and task param names clash",
      description: `Could not add a param to your task because its name is used as a param for Redspot.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    MANDATORY_PARAM_AFTER_OPTIONAL: {
      number: 203,
      message:
        "Could not set param %paramName% for task %taskName% because it is mandatory and it was added after an optional positional param.",
      title: "Optional param followed by a required one",
      description: `Could not add param to your task because it is required and it was added after an optional positional param.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    OVERRIDE_NO_MANDATORY_PARAMS: {
      number: 204,
      message:
        "Redefinition of task %taskName% failed. Unsupported operation adding mandatory (non optional) param definitions in an overridden task.",
      title: "Attempted to add mandatory params to an overridden task",
      description: `You can't add mandatory (non optional) param definitions in an overridden task.
The only supported param additions for overridden tasks are flags,
and optional params.

Please, double check your task definitions.`,
      shouldBeReported: false,
    },
    OVERRIDE_NO_POSITIONAL_PARAMS: {
      number: 205,
      message:
        "Redefinition of task %taskName% failed. Unsupported operation adding positional param definitions in an overridden task.",
      title: "Attempted to add positional params to an overridden task",
      description: `You can't add positional param definitions in an overridden task.
The only supported param additions for overridden tasks are flags,
and optional params.

Please, double check your task definitions.`,
      shouldBeReported: false,
    },
    OVERRIDE_NO_VARIADIC_PARAMS: {
      number: 206,
      message:
        "Redefinition of task %taskName% failed. Unsupported operation adding variadic param definitions in an overridden task.",
      title: "Attempted to add variadic params to an overridden task",
      description: `You can't add variadic param definitions in an overridden task.
The only supported param additions for overridden tasks are flags,
and optional params.

Please, double check your task definitions.`,
      shouldBeReported: false,
    },

    ACTION_NOT_SET: {
      number: 207,
      message: "No action set for task %taskName%.",
      title: "Tried to run task without an action",
      description: `A task was run, but it has no action set.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    RUNSUPER_NOT_AVAILABLE: {
      number: 208,
      message:
        "Tried to call runSuper from a non-overridden definition of task %taskName%",
      title: "`runSuper` not available",
      description: `You tried to call \`runSuper\` from a non-overridden task.

Please use \`runSuper.isDefined\` to make sure that you can call it.`,
      shouldBeReported: false,
    },
    DEFAULT_VALUE_WRONG_TYPE: {
      number: 209,
      message:
        "Default value for param %paramName% of task %taskName% doesn't match the default one, try specifying it.",
      title: "Default value has incorrect type",
      description: `One of your tasks has a parameter whose default value doesn't match the expected type.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    DEFAULT_IN_MANDATORY_PARAM: {
      number: 210,
      message:
        "Default value for param %paramName% of task %taskName% shouldn't be set.",
      title: "Required parameter has a default value",
      description: `One of your tasks has a required parameter with a default value.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
    INVALID_PARAM_NAME_CASING: {
      number: 211,
      message:
        "Invalid param name %paramName% in task %taskName%. Param names must be camelCase.",
      title: "Invalid casing in parameter name",
      description: `Your parameter names must use camelCase.

Please double check your task definitions.`,
      shouldBeReported: false,
    },
  },
  ARGUMENTS: {
    INVALID_ENV_VAR_VALUE: {
      number: 300,
      message: "Invalid environment variable %varName%'s value: %value%",
      title: "Invalid environment variable value",
      description: `You are setting one of Redspot arguments using an environment variable, but it has an incorrect value.

Please double check your environment variables.`,
      shouldBeReported: false,
    },
    INVALID_VALUE_FOR_TYPE: {
      number: 301,
      message: "Invalid value %value% for argument %name% of type %type%",
      title: "Invalid argument type",
      description: `One of your Redspot or task's arguments has an invalid type.

Please double check your arguments.`,
      shouldBeReported: false,
    },
    INVALID_INPUT_FILE: {
      number: 302,
      message:
        "Invalid argument %name%: File %value% doesn't exist or is not a readable file.",
      title: "Invalid file argument",
      description: `One of your tasks expected a file as an argument, but you provided a
non-existent or non-readable file.

Please double check your arguments.`,
      shouldBeReported: false,
    },
    UNRECOGNIZED_TASK: {
      number: 303,
      message: "Unrecognized task %task%",
      title: "Unrecognized task",
      description: `Tried to run a non-existent task.

Please double check the name of the task you are trying to run.`,
      shouldBeReported: false,
    },
    UNRECOGNIZED_COMMAND_LINE_ARG: {
      number: 304,
      message:
        "Unrecognised command line argument %argument%.\nNote that task arguments must come after the task name.",
      title: "Unrecognized command line argument",
      description: `Redspot couldn't recognize one of your command line arguments.

This may be because you are writing it before the task name. It should come after it.

Please double check how you invoked Redspot.`,
      shouldBeReported: false,
    },
    UNRECOGNIZED_PARAM_NAME: {
      number: 305,
      message: "Unrecognized param %param%",
      title: "Unrecognized param",
      description: `Redspot couldn't recognize one of your tasks' parameters.

Please double check how you invoked Redspot or run your task.`,
      shouldBeReported: false,
    },
    MISSING_TASK_ARGUMENT: {
      number: 306,
      message: "Missing task argument %param%",
      title: "Missing task argument",
      description: `You tried to run a task, but one of its required arguments was missing.

Please double check how you invoked Redspot or run your task.`,
      shouldBeReported: false,
    },
    MISSING_POSITIONAL_ARG: {
      number: 307,
      message: "Missing positional argument %param%",
      title: "Missing task positional argument",
      description: `You tried to run a task, but one of its required arguments was missing.

Please double check how you invoked Redspot or run your task.`,
      shouldBeReported: false,
    },
    UNRECOGNIZED_POSITIONAL_ARG: {
      number: 308,
      message: "Unrecognized positional argument %argument%",
      title: "Unrecognized task positional argument",
      description: `You tried to run a task with more positional arguments than needed.

Please double check how you invoked Redspot or run your task.`,
      shouldBeReported: false,
    },
    REPEATED_PARAM: {
      number: 309,
      message: "Repeated parameter %param%",
      title: "Repeated task parameter",
      description: `You tried to run a task with a repeated parameter.

Please double check how you invoked Redspot or run your task.`,
      shouldBeReported: false,
    },
    PARAM_NAME_INVALID_CASING: {
      number: 310,
      message: "Invalid param %param%. Command line params must be lowercase.",
      title: "Invalid casing in command line parameter",
      description: `You tried to run redspot with a parameter with invalid casing. They must be lowercase.

Please double check how you invoked Redspot.`,
      shouldBeReported: false,
    },
    INVALID_JSON_ARGUMENT: {
      number: 311,
      message: "Error parsing JSON value for argument %param%: %error%",
      title: "Invalid JSON parameter",
      description: `You tried to run a task with an invalid JSON parameter.

Please double check how you invoked Redspot or run your task.`,
      shouldBeReported: false,
    },
  },
  RESOLVER: {
    FILE_NOT_FOUND: {
      number: 400,
      message: "File %file% doesn't exist.",
      title: "Solidity file not found",
      description: `Tried to resolve a non-existing Solidity file as an entry-point.`,
      shouldBeReported: false,
    },
  },
  BUILTIN_TASKS: {
    COMPILE_FAILURE: {
      number: 500,
      message: "Compilation failed",
      title: "Compilation failed",
      description: `Your smart contracts failed to compile.

Please check Redspot's output for more details.`,
      shouldBeReported: false,
    },
    RUN_FILE_NOT_FOUND: {
      number: 501,
      message: "Script %script% doesn't exist.",
      title: "Script doesn't exist",
      description: `Tried to use \`redspot run\` to execut a non-existing script.

Please double check your script's path`,
      shouldBeReported: false,
    },
    RUN_SCRIPT_ERROR: {
      number: 502,
      message: "Error running script {%script%}: %error%",
      title: "Error running script",
      description: `Running a script resulted in an error.

Please check Redspot's output for more details.`,
      shouldBeReported: false,
    },
  },
  ARTIFACTS: {
    NOT_FOUND: {
      number: 600,
      message: 'Artifact for contract "%contractName%" not found.',
      title: "Artifact not found",
      description: `Tried to import a non-existing artifact.

Please double check that your contracts have been compiled and your artifact's name.`,
      shouldBeReported: false,
    },
  },
  PLUGINS: {
    NOT_INSTALLED: {
      number: 700,
      message: `Plugin %plugin% is not installed.
%extraMessage%Please run: yarn add %extraFlags% %plugin%`,
      title: "Plugin not installed",
      description: `You are trying to use a plugin that hasn't been installed.

Please follow Redspot's instructions to resolve this.`,
      shouldBeReported: false,
    },
    MISSING_DEPENDENCY: {
      number: 701,
      message: `Plugin %plugin% requires %dependency% to be installed.
%extraMessage%Please run: yarn add %extraFlags% "%dependency%@%versionSpec%"`,
      title: "Plugin dependencies not installed",
      description: `You are trying to use a plugin with unmet dependencies.

Please follow Redspot's instructions to resolve this.`,
      shouldBeReported: false,
    },
    DEPENDENCY_VERSION_MISMATCH: {
      number: 702,
      message: `Plugin %plugin% requires %dependency% version %versionSpec% but got %installedVersion%.
%extraMessage%If you haven't installed %dependency% manually, please run: yarn add %extraFlags% "%dependency%@%versionSpec%"
If you have installed %dependency% yourself, please reinstall it with a valid version.`,
      title: "Plugin dependencies's version mismatch",
      description: `You are trying to use a plugin that requires a different version of one of its dependencies.

Please follow Redspot's instructions to resolve this.`,
      shouldBeReported: false,
    },
  },
  INTERNAL: {
    TEMPLATE_INVALID_VARIABLE_NAME: {
      number: 800,
      message:
        "Variable names can only include ascii letters and numbers, and start with a letter, but got %variable%",
      title: "Invalid error message template",
      description: `An error message template contains an invalid variable name. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG: {
      number: 801,
      message:
        "Template values can't include variable tags, but %variable%'s value includes one",
      title: "Invalid error message replacement",
      description: `Tried to replace an error message variable with a value that contains another variable name. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
    TEMPLATE_VARIABLE_TAG_MISSING: {
      number: 802,
      message: "Variable %variable%'s tag not present in the template",
      title: "Missing replacement value from error message template",
      description: `An error message template is missing a replacement value. This is a bug.

Please [report it](https://github.com/patractlabs/redspot-0.2/issues/new) to help us improve Redspot.`,
      shouldBeReported: true,
    },
  },
};
