import type { RedspotRuntimeEnvironment } from "redspot/types";

export default async function getSigners(env: RedspotRuntimeEnvironment) {
  return env.network.provider.accounts.map((account) => {
    return env.network.provider.createSigner(account);
  });
}
