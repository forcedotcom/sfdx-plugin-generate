const { fancy } = require('fancy-test');
const path = require('path');
const sh = require('shelljs');
const npmPath = require('npm-run-path');
const tmp = require('tmp');
const os = require('os');

sh.set('-ev');

// remove CI env var so tests don't run nyc
const { CI } = process.env;
delete process.env.CI;
process.env.OCLIF_DEBUG = '1';

process.env.YARN_MUTEX = `file:${path.join(os.tmpdir(), 'yarn.mutex')}`;

function generate(args) {
  const run = path.join(__dirname, '../bin/run');
  sh.exec(`node ${run} ${args}`);
}

function build(type, features) {
  let dir = tmp.tmpNameSync();
  // replace colon with dash because running commands
  // inside of a directory with a colon in the name causes errors
  dir = path.join(dir, type, features);
  sh.rm('-rf', dir);
  const cmd = type.replace('-', ':');
  generate(`${cmd} ${dir} --defaults`);
  sh.cd(dir);
  // sh.exec('git add .')
  // sh.exec('git commit -nm init')
  // sh.exec('git checkout -B origin/master')
  process.env = npmPath.env({ env: process.env });
  sh.exec('yarn prepack');
}

module.exports = (file) => {
  const f = path.parse(file);
  const [name] = f.name.split('.');
  const cmd = path.basename(f.dir);

  describe(cmd, () => {
    fancy
      .retries(CI ? 1 : 0)
      .timeout(600_000)
      .do(() => {
        build(cmd, name);
        sh.exec('yarn test');
        sh.exec('node ./bin/run hello:org --help');
        sh.exec('npm pack --unsafe-perm');
      })
      .it([cmd, name].join(':'));
  });
};
