const gulp = require('gulp');
const rename = require('gulp-rename');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const execSync = require('@patract/dev/scripts/execSync');

const dist = 'build';

function cleanBuild(callback) {
  execSync('yarn polkadot-dev-clean-build');
}

function copyTemplate() {
  return new Promise((resolve, reject) => {
    console.log('Copy template');
    return gulp
      .src('packages/redspot-template/**/*', {
        ignore: ['**/node_modules/**/*']
      })
      .pipe(gulp.dest(`${dist}/redspot-template`))
      .on('end', resolve)
      .on('error', reject);
  });
}

function copyExplorer() {
  return new Promise((resolve, reject) => {
    console.log('Copy explorer');
    return gulp
      .src('packages/redspot-explorer/**/*', {
        ignore: ['**/node_modules/**/*']
      })
      .pipe(gulp.dest(`${dist}/redspot-explorer`))
      .on('end', resolve)
      .on('error', reject);
  });
}

function copyFiles() {
  return new Promise((resolve, reject) => {
    console.log('Copy files');
    const CPX = ['css', 'gif', 'hbs', 'jpg', 'js', 'png', 'svg', 'd.ts', 'json']
      .map((ext) => `src/**/*.${ext}`)
      .concat(['package.json', 'LICENSE']);

    return gulp
      .src(
        CPX.map((x) => `packages/*/${x}`),
        {
          ignore: ['**/node_modules/**/*', '**/redspot-template/**/*']
        }
      )
      .pipe(gulp.dest(dist))
      .on('end', resolve)
      .on('error', reject);
  });
}

function buildTs() {
  return new Promise((resolve, reject) => {
    console.log('Build typescript');
    tsProject
      .src()
      .pipe(tsProject())
      .pipe(
        rename(function (path) {
          return {
            dirname: path.dirname.replace(
              /^([a-zA-Z0-9-_]*)(\/src)(\/.*|$)/g,
              '$1$3'
            ),
            basename: path.basename,
            extname: path.extname
          };
        })
      )
      .pipe(gulp.dest(dist))
      .on('end', resolve)
      .on('error', reject);
  });
}

async function run() {
  cleanBuild();

  await buildTs();
  await copyTemplate();
  await copyExplorer();
  await copyFiles();

  console.log('Build complete');
}

run().catch((error) => {
  console.log(error);
});
