import fsExtra from "fs-extra";
import { task } from "../internal/core/config/config-env";
import { TASK_CLEAN } from "./task-names";

export default function () {
  task(
    TASK_CLEAN,
    "Clears the cache and deletes all artifacts",
    async (_, { config }) => {
      console.log(`Delete ${config.paths.cache}`);
      await fsExtra.emptyDir(config.paths.cache);
      console.log(`Delete ${config.paths.artifacts}`);
      await fsExtra.remove(config.paths.artifacts);
      console.log("Done!");
    }
  );
}
