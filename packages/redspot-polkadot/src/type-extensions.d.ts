import "redspot/types";
import Api from "./api";

declare module "redspot/types" {
  interface RedspotRuntimeEnvironment {
    polkadot?: Api;
  }
}
