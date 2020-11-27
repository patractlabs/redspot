import { RedspotContext } from './context';

// This function isn't meant to be used during the Redspot execution,
// but rather to reset Redspot in between tests.
export function resetRedspotContext() {
  if (RedspotContext.isCreated()) {
    const ctx = RedspotContext.getRedspotContext();

    if (ctx.environment !== undefined) {
      const globalAsAny = global as any;

      for (const key of Object.keys(ctx.environment)) {
        globalAsAny[key] = undefined;
      }
    }

    const filesLoadedDuringConfig = ctx.getFilesLoadedDuringConfig();

    filesLoadedDuringConfig.forEach(unloadModule);

    RedspotContext.deleteRedspotContext();
  }

  // Unload all the redspot's entry-points.
  unloadModule('../register');
  unloadModule('./cli/cli');
  unloadModule('./lib/redspot-lib');
}

function unloadModule(path: string) {
  try {
    delete require.cache[require.resolve(path)];
  } catch (err) {
    // module wasn't loaded
  }
}
