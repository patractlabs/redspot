#!/usr/bin/env node
// Copyright 2017-2020 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

const os = require('os');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const copySync = require('@patract/dev/scripts/copySync');
const execSync = require('@patract/dev/scripts/execSync');
const { glob } = require('glob');

function runClean() {
  execSync('yarn polkadot-dev-clean-build');
}

function runCheck() {
  execSync('yarn lint');
}

function runTest() {
  execSync('yarn test');

  // if [ -f "coverage/lcov.info" ] && [ -n "$COVERALLS_REPO_TOKEN" ]; then
  //   console.log('*** Submitting to coveralls.io');

  //   (cat coverage/lcov.info | yarn run coveralls) || true
  // fi
}

function runBuild() {
  execSync('yarn build');
}

function npmGetVersion() {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
  ).version;
}

function npmPublish() {
  const tag = npmGetVersion().includes('-') ? '--tag beta' : '';
  let count = 1;

  while (true) {
    try {
      execSync(`npm publish`);

      break;
    } catch (error) {
      if (count < 5) {
        const end = Date.now() + 15000;

        console.error(`Publish failed on attempt ${count}/5. Retrying in 15s`);
        count++;

        while (Date.now() < end) {
          // just spin our wheels
        }
      }
    }
  }
}

function loopFunc(fn) {
  const buildPackage = glob.sync('build/*/package.json');

  if (buildPackage.length) {
    buildPackage.forEach((packagePath) => {
      const dir = path.dirname(packagePath);
      process.chdir(dir);
      fn();
      process.chdir('../..');
    });
  }

  if (fs.existsSync('packages')) {
    fs.readdirSync('packages')
      .filter((dir) => {
        const pkgDir = path.join(process.cwd(), 'packages', dir);

        return (
          fs.statSync(pkgDir).isDirectory() &&
          fs.existsSync(path.join(pkgDir, 'package.json')) &&
          fs.existsSync(path.join(pkgDir, 'build'))
        );
      })
      .forEach((dir) => {
        process.chdir(path.join('packages', dir));
        if (fs.existsSync('.skip-npm')) {
          process.chdir('../..');
          return;
        }

        rimraf.sync('build/package.json');
        ['LICENSE', 'README.md', 'package.json'].forEach((file) =>
          copySync(file, 'build')
        );

        process.chdir('build');

        fn();

        process.chdir('../../..');
      });
  } else {
    fn();
  }
}

runClean();
runBuild();

loopFunc(npmPublish);
