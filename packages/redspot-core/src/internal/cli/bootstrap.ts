import { fork } from "child_process";
import { getEnvRedspotArguments } from "../core/params/env-variables";
import { REDSPOT_PARAM_DEFINITIONS } from "../core/params/redspot-params";
import { ArgumentsParser } from "./ArgumentsParser";

const nodeArgs = [...process.execArgv];

if (process.env.DISABLE_REDSPOTEVM_OPTIMIZATIONS === undefined) {
  nodeArgs.push("--max-semi-space-size=100");
}

const envVariableArguments = getEnvRedspotArguments(
  REDSPOT_PARAM_DEFINITIONS,
  process.env
);

const argumentsParser = new ArgumentsParser();

const { redspotArguments } = argumentsParser.parseRedspotArguments(
  REDSPOT_PARAM_DEFINITIONS,
  envVariableArguments,
  process.argv.slice(2)
);

if (redspotArguments.maxMemory !== undefined) {
  nodeArgs.push(`--max-old-space-size=${redspotArguments.maxMemory}`);
}

const childProcess = fork(`${__dirname}/cli`, process.argv.slice(2), {
  stdio: "inherit" as any, // There's an error in the TS definition of ForkOptions
  execArgv: nodeArgs,
});

childProcess.once("close", (status) => {
  process.exit(status);
});
