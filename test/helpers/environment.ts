import { resetBuidlerContext } from "@redspot/buidler/internal/reset";
import { BuidlerRuntimeEnvironment } from "@redspot/buidler/types";

declare module "mocha" {
  interface Context {
    env: BuidlerRuntimeEnvironment;
  }
}

export function useEnvironment() {
  beforeEach("Load environment", function () {
    this.env = require("@redspot/buidler/internal/lib/buidler-lib");
  });

  afterEach("reset buidler context", function () {
    resetBuidlerContext();
  });
}
