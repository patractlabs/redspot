import execa from 'execa';
import { RedspotConfig } from '../../types';

export const DOCKER_IMAGE_NAME = 'redspot/contract';
export const WORK_DIR = '/usr/src/contract';

export const compileDocker = (
  config: RedspotConfig,
  patterns = [] as string[]
) => {
  const root = config.paths.root;
  const { stdout: id } = execa.commandSync('id -u');
  const { stdout: group } = execa.commandSync('id -g');
  const command = [
    'docker run --rm',
    `-v ${root}:/${WORK_DIR}`,
    `-w ${WORK_DIR}`,
    `-v ${config.paths.cache}/ink/:/cache/`,
    `-e CARGO_HOME=/cache/cargo/`,
    `-e SCCACHE_DIR=/cache/sccache/`,
    DOCKER_IMAGE_NAME,
    `/bin/bash -c`,
    `"npx redspot compile ${patterns.join(
      ' '
    )} --docker false && chown -R ${id}:${group} ${WORK_DIR}"`
  ].join(' ');

  console.log(`$ ${command}`);
  console.log('');

  execa.commandSync(command, {
    stdio: 'inherit',
    shell: true
  });
};
