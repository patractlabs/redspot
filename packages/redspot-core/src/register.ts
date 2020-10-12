import debug from "debug";
import { RedspotContext } from "./internal/context";
import { loadConfigAndTasks } from "./internal/core/config/config-loading";
import { getEnvRedspotArguments } from "./internal/core/params/env-variables";
import { REDSPOT_PARAM_DEFINITIONS } from "./internal/core/params/redspot-params";
import { Environment } from "./internal/core/runtime-environment";
import { loadTsNodeIfPresent } from "./internal/core/typescript-support";
import {
  disableReplWriterShowProxy,
  isNodeCalledWithoutAScript,
} from "./internal/util/console";

if (!RedspotContext.isCreated()) {
  // tslint:disable-next-line no-var-requires
  require("source-map-support/register");

  const ctx = RedspotContext.createRedspotContext();

  if (isNodeCalledWithoutAScript()) {
    disableReplWriterShowProxy();
  }

  loadTsNodeIfPresent();

  const redspotArguments = getEnvRedspotArguments(
    REDSPOT_PARAM_DEFINITIONS,
    process.env
  );

  if (redspotArguments.verbose) {
    debug.enable("redspot*");
  }

  const config = loadConfigAndTasks(redspotArguments);

  // TODO: This is here for backwards compatibility.
  // There are very few projects using this.
  if (redspotArguments.network === undefined) {
    redspotArguments.network = config.defaultNetwork;
  }

  const env = new Environment(
    config,
    redspotArguments,
    ctx.tasksDSL.getTaskDefinitions(),
    ctx.extendersManager.getExtenders()
  );

  ctx.setRedspotRuntimeEnvironment(env);

  env.injectToGlobal();
}
