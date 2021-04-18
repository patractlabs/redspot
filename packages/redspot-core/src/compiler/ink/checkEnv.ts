import { execSync } from 'child_process';
import semver from 'semver';

export function getCargoContractVersion(): string | null {
  try {
    const versionData = execSync('cargo contract -V');

    const [version]: string[] =
      versionData.toString().split(/\s/)[1]?.trim().split('-') || [];

    return semver.valid(version);
  } catch (error) {
    return null;
  }
}

export async function checkEnv({ version }: { version: string }) {
  const currentVersion = getCargoContractVersion();

  if (!currentVersion) {
    return false;
  } else if (semver.lt(currentVersion, version)) {
    return false;
  }

  return currentVersion;
}
