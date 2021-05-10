const vm = require('vm');
const { create } = require('ts-node');

console.log('Script is running...');
console.log(`Network: ${process.env.REDSPOT_NETWORK}`);

const service = create({
  typeCheck: false,
  files: false,
  transpileOnly: true
});

const str = service.compile(
  `require('ts-node/register');${process.env.SOURCE}`,
  'script.js'
);

const sandBox = vm.createContext({ require, console, exports });

vm.runInContext(str, sandBox);
