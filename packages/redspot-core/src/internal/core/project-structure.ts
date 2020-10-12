import findUp from "find-up";
import { RedspotError } from "./errors";
import { ERRORS } from "./errors-list";
import { isTypescriptSupported } from "./typescript-support";

const JS_CONFIG_FILENAME = "redspot.config.js";
const TS_CONFIG_FILENAME = "redspot.config.ts";

export function isCwdInsideProject() {
  return (
    findUp.sync(JS_CONFIG_FILENAME) !== null ||
    (isTypescriptSupported() && findUp.sync(TS_CONFIG_FILENAME) !== null)
  );
}

export function getUserConfigPath() {
  if (isTypescriptSupported()) {
    const tsConfigPath = findUp.sync(TS_CONFIG_FILENAME);
    if (tsConfigPath !== null) {
      return tsConfigPath;
    }
  }

  const pathToConfigFile = findUp.sync(JS_CONFIG_FILENAME);
  if (pathToConfigFile === null) {
    throw new RedspotError(ERRORS.GENERAL.NOT_INSIDE_PROJECT);
  }

  return pathToConfigFile;
}
