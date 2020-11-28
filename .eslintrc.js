const base = require('@patract/dev/config/eslint');

module.exports = {
  ...base,
  ignorePatterns: [
    '.eslintrc.js',
    '.github/**',
    '.vscode/**',
    '.yarn/**',
    '**/build/*',
    '**/coverage/*',
    '**/node_modules/*'
  ],
  parserOptions: {
    ...base.parserOptions,
    project: ['./tsconfig.json']
  },
  rules: {
    ...base.rules,
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    'default-param-last': 'off',
    'promise/param-names': 'off',
    'node/no-path-concat': 'off',
    'sort-keys': 'off'
  }
};
