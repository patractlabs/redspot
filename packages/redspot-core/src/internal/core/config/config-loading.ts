import path from "path";
import { RedspotArguments, ResolvedRedspotConfig } from "../../../types";
import { RedspotContext } from "../../context";
import { loadPluginFile } from "../plugins";
import { getUserConfigPath } from "../project-structure";
import { resolveConfig } from "./config-resolution";
import { validateConfig } from "./config-validation";

function importCsjOrEsModule(filePath: string): any {
  const imported = require(filePath);
  return imported.default !== undefined ? imported.default : imported;
}

export function loadConfigAndTasks(
  redspotArguments?: Partial<RedspotArguments>
): ResolvedRedspotConfig {
  let configPath =
    redspotArguments !== undefined ? redspotArguments.config : undefined;

  if (configPath === undefined) {
    configPath = getUserConfigPath();
  } else {
    if (!path.isAbsolute(configPath)) {
      configPath = path.join(process.cwd(), configPath);
      configPath = path.normalize(configPath);
    }
  }

  // Before loading the builtin tasks, the default and user's config we expose
  // the config env in the global object.
  const configEnv = require("./config-env");

  const globalAsAny: any = global;

  Object.entries(configEnv).forEach(
    ([key, value]) => (globalAsAny[key] = value)
  );

  const ctx = RedspotContext.getRedspotContext();
  ctx.setConfigPath(configPath);

  loadPluginFile(path.join(__dirname, "..", "tasks", "builtin-tasks"));

  const defaultConfig = importCsjOrEsModule("./default-config");
  const userConfig = importCsjOrEsModule(configPath);
  validateConfig(userConfig);

  // To avoid bad practices we remove the previously exported stuff
  Object.keys(configEnv).forEach((key) => (globalAsAny[key] = undefined));

  const resolved = resolveConfig(
    configPath,
    defaultConfig,
    userConfig,
    RedspotContext.getRedspotContext().configExtenders
  );

  return resolved;
}
