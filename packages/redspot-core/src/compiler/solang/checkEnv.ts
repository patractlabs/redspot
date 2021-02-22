import { execSync } from 'child_process';

export async function checkEnv({ version }: { version: string }) {
  try {
    execSync('solang --version');
    return true;
  } catch (error) {
    return false;
  }
}
