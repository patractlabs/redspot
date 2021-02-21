const yargs = require('yargs');
const { execSync } = require('child_process');

const [exampleName, ...rest] = yargs.argv._;

if (!exampleName) {
  throw new Error('no exampleName');
}

const execCommand = `TS_NODE_PROJECT=../../tsconfig.json TS_NODE_TRANSPILE_ONLY=true node -r ts-node/register -r tsconfig-paths/register ../../packages/redspot-core/src/internal/cli/cli.ts ${rest.join(
  ' '
)}`;

execSync(execCommand, {
  cwd: `./examples/${exampleName}`,
  stdio: 'inherit'
});
