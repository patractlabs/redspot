import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export const mkCacheDir = (root: string): string => {
  const _path = path.join(root, '.cache');
  fs.mkdirSync(_path);
  return _path;
};

export const rmCacheDir = (root: string): void => {
  fs.removeSync(path.join(root, '.cache'));
};

export const cloneRepo = (repo: string, path: string): void => {
  execSync(`git clone --depth 1 ${repo} ${path}`);
};
