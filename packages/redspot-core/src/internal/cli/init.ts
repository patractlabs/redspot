import chalk from 'chalk';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

process.on('unhandledRejection', (err) => {
  throw err;
});

function init(
  appPath: string,
  appName: string,
  logLevel: string,
  originalDirectory: string,
  templateToInstall: string,
  templateName: string
) {
  const appPackage = require(path.join(appPath, 'package.json'));
  const useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'));

  const templatePath = path.dirname(
    require.resolve(`${templateToInstall}/package.json`, { paths: [appPath] })
  );

  const templateJsonPath = path.join(templatePath, 'template.json');

  let templateJson: any = {};
  if (fs.existsSync(templateJsonPath)) {
    templateJson = require(templateJsonPath);
  }

  const templatePackage = templateJson.package || {};

  if (templateJson.dependencies) {
    templatePackage.dependencies = templateJson.dependencies;
  }
  if (templateJson.scripts) {
    templatePackage.scripts = templateJson.scripts;
  }

  const templatePackageToMerge = ['dependencies', 'scripts'];

  const templatePackageToReplace = Object.keys(templatePackage).filter(
    (key) => {
      return !templatePackageToMerge.includes(key);
    }
  );

  appPackage.scripts = { ...(templatePackage.scripts || {}) };

  if (useYarn) {
    appPackage.scripts = Object.entries(appPackage.scripts).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: (value as string).replace(/(npm run |npm )/, 'yarn ')
      }),
      {}
    );
  }

  templatePackageToReplace.forEach((key) => {
    appPackage[key] = templatePackage[key];
  });

  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2) + os.EOL
  );

  // Copy the files for the user
  const templateDir = path.join(templatePath, 'templates', templateName);
  if (fs.existsSync(templateDir)) {
    fs.copySync(templateDir, appPath);
  } else {
    console.error(`Could not locate template: ${chalk.green(templateDir)}`);
    return;
  }

  // Copy the common files
  const commonDir = path.join(templatePath, 'common');
  if (fs.existsSync(commonDir)) {
    fs.copySync(commonDir, appPath);
  } else {
    console.error(`Could not locate template: ${chalk.green(commonDir)}`);
    return;
  }

  const gitignoreExists = fs.existsSync(path.join(appPath, '.gitignore'));
  if (gitignoreExists) {
    // Append if there's already a `.gitignore` file there
    const data = fs.readFileSync(path.join(appPath, 'gitignore'));
    fs.appendFileSync(path.join(appPath, '.gitignore'), data);
    fs.unlinkSync(path.join(appPath, 'gitignore'));
  } else {
    fs.moveSync(
      path.join(appPath, 'gitignore'),
      path.join(appPath, '.gitignore'),
      [] as any
    );
  }

  let command;
  let remove;
  let args;

  if (useYarn) {
    command = 'yarnpkg';
    remove = 'remove';
    args = ['add'];
  } else {
    command = 'npm';
    remove = 'uninstall';
    args = ['install', '--save', Number(logLevel) >= 5 && '--verbose'].filter(
      (e) => e
    );
  }

  // Install additional template dependencies, if present.
  const dependenciesToInstall = Object.entries({
    ...templatePackage.dependencies,
    ...templatePackage.devDependencies
  });
  if (dependenciesToInstall.length) {
    args = args.concat(
      dependenciesToInstall.map(([dependency, version]) => {
        return `${dependency}@${version}`;
      })
    );
  }

  if (templateName && args.length > 1) {
    console.log();
    console.log(`Installing template dependencies using ${command}...`);

    const proc = spawn.sync(command, args, { stdio: 'inherit' });
    if (proc.status !== 0) {
      console.error(`\`${command} ${args.join(' ')}\` failed`);
      return;
    }
  }

  // Remove template
  console.log(`Removing template package using ${command}...`);
  console.log();

  const proc = spawn.sync(command, [remove, templateToInstall], {
    stdio: 'inherit'
  });
  if (proc.status !== 0) {
    console.error(`\`${command} ${args.join(' ')}\` failed`);
  }

  // Change displayed command to yarn instead of yarnpkg
  const displayedCommand = 'npx redspot';

  console.log();
  console.log(
    `🎉  Success! Created ${chalk.yellow(appName)} at ${chalk.green(appPath)}`
  );
  console.log(
    '👉  Inside that directory, you can run several commands to help you develop the contract:'
  );
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} compile`));
  console.log('    Compile the contract.');
  console.log('');
  console.log(chalk.cyan(`  ${displayedCommand} test`));
  console.log('    Test the contract.');
  console.log('');
  console.log(chalk.cyan(`  ${displayedCommand} help`));
  console.log('    Display the help information.');
  console.log('');
}

export { init };
