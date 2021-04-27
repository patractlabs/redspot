// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest/utils');

const { compilerOptions } = require('./tsconfig.json');
const path = require('path');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  verbose: true,
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: path.resolve(__dirname)
  }),
  transformIgnorePatterns: [
    '/node_modules/(?!@polkadot|@babel/runtime/helpers/esm/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/examples/',
    '<rootDir>/packages/redspot-template/',
    '<rootDir>/build/',
    '<rootDir>/packages/redspot-core/src/builtin-tasks/test.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        // allow js in typescript
        allowJs: true
      }
    }
  }
};
