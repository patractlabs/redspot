module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "redspot/(.*)$": "../../packages/redspot-core/src/$1",
    "@redspot/polkadot(.*)$": "<rootDir>/packages/redspot-polkadot/src/$1",
    "@redspot/patract(.*)$": "<rootDir>/packages/redspot-patract/src/$1",
  },
};
