const gulp = require('gulp');
const rename = require('gulp-rename');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const execSync = require('@patract/dev/scripts/execSync');

const dist = 'build';

function cleanBuild() {
  execSync('yarn polkadot-dev-clean-build');
}

function copyTemplate() {
  console.log('Copy template');
  return gulp
    .src('packages/redspot-template/**/*', {
      ignore: ['**/node_modules/**/*']
    })
    .pipe(gulp.dest(`${dist}/redspot-template`));
}

function copyFiles() {
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
    .pipe(gulp.dest(dist));
}

function buildTs() {
  console.log('Build typescript');
  return tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(
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
    .pipe(gulp.dest(dist));
}

function run() {
  cleanBuild();
  buildTs();
  copyTemplate();
  copyFiles();
}

run();
