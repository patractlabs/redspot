import debug from "debug";
import { RedspotRuntimeEnvironment } from "../../types";
import { RedspotContext } from "../context";
import { loadConfigAndTasks } from "../core/config/config-loading";
import { RedspotError } from "../core/errors";
import { ERRORS } from "../core/errors-list";
import { getEnvRedspotArguments } from "../core/params/env-variables";
import { REDSPOT_PARAM_DEFINITIONS } from "../core/params/redspot-params";
import { Environment } from "../core/runtime-environment";

let ctx: RedspotContext;
let env: RedspotRuntimeEnvironment;

if (RedspotContext.isCreated()) {
  ctx = RedspotContext.getRedspotContext();

  // The most probable reason for this to happen is that this file was imported
  // from the config file
  if (ctx.environment === undefined) {
    throw new RedspotError(ERRORS.GENERAL.LIB_IMPORTED_FROM_THE_CONFIG);
  }

  env = ctx.environment;
} else {
  ctx = RedspotContext.createRedspotContext();

  const redspotArguments = getEnvRedspotArguments(
    REDSPOT_PARAM_DEFINITIONS,
    process.env
  );

  if (redspotArguments.verbose) {
    debug.enable("redspot*");
  }

  const config = loadConfigAndTasks(redspotArguments);

  env = new Environment(
    config,
    redspotArguments,
    ctx.tasksDSL.getTaskDefinitions(),
    ctx.extendersManager.getExtenders()
  );

  ctx.setRedspotRuntimeEnvironment(env);
}

module.exports = env;
