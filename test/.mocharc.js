module.exports = {
  require: [
    "mocha.env",
    "ts-node/register",
    "tsconfig-paths/register",
    "source-map-support/register",
  ],
  exclude: "fixture-projects/**/*.ts",
  exclude: "fixture-projects/**/*.js",
  exclude: "helpers/**/*.ts",
  timeout: 25000,
  recursive: true,
};
