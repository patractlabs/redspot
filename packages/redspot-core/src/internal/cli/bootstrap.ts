import { fork } from "child_process";

const nodeArgs = [...process.execArgv];

if (process.env.DISABLE_REDSPOTEVM_OPTIMIZATIONS === undefined) {
  nodeArgs.push("--max-semi-space-size=100");
}

const childProcess = fork(`${__dirname}/cli`, process.argv.slice(2), {
  stdio: "inherit" as any, // There's an error in the TS definition of ForkOptions
  execArgv: nodeArgs,
});

childProcess.once("close", (status) => {
  process.exit(status);
});
