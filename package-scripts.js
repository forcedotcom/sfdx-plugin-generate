/* eslint-disable unicorn/filename-case */

const script = (script, description) => description ? {script, description} : {script}
const _ = require('lodash')
const sh = require('shelljs')
const path = require('path')
const {execSync} = require('child_process')

let hasYarn = false
try {
  execSync('yarn -v', {stdio: 'ignore'})
  hasYarn = true
} catch (error) {}

const pkgManager = hasYarn ? 'yarn' : 'npm run'

sh.set('-e')

const testTypes = ['plugins-generate']
const tests = testTypes.map(cmd => {
  const {silent} = sh.config
  sh.config.silent = true
  let mocha = 'mocha --forbid-only'
  const base = path.join('test/commands', cmd)
  sh.pushd(base)
  let tests = _(sh.ls())
  .map(t => [t.split('.')[0], path.join(base, t)])
  .map(([t, s]) => {
    const mochaString = process.env.CIRCLECI ? `MOCHA_FILE=reports/mocha-${t}.xml ${mocha} --reporter mocha-junit-reporter ${s}` : `${mocha} ${s}`
    const concurretlyString = 'node node_modules/concurrently/dist/bin/concurrently.js --kill-others-on-fail --prefix-colors "dim" --prefix "[{name}]" --names "basic"'
    return [t, `${concurretlyString} ${mochaString}`]
  })
  sh.popd()
  tests = process.env.TEST_SERIES === '1' ?
    tests.map(t => t[1].value()).join(' && ') :
    tests.fromPairs().value()
  if (process.env.CIRCLECI) {
    tests = `${pkgManager} mkdirp reports && ${_.isArray(tests) ? tests.join(' && ') : tests}`
  }
  sh.config.silent = silent
  return [cmd, `${pkgManager} build && ${_.isArray(tests) ? tests.join(' && ') : tests}`]
})

module.exports = {
  scripts: {
    build: 'rm -rf lib && tsc',
    lint: {
      default: 'node node_modules/concurrently/dist/bin/concurrently.js --kill-others-on-fail --prefix-colors "dim,dim,dim" --prefix "[{name}]" --names "lint.eslint, lint.tsc, lint.tslint" \'nps lint.eslint\' \'nps lint.tsc\' \'nps lint.tslint\'',
      eslint: script('eslint .', 'lint js files'),
      tsc: script('tsc --noEmit', 'syntax check with tsc'),
      tslint: script('tslint -p .', 'lint ts files'),
    },
    test: Object.assign({
      default: testTypes.map(t => `test.${t}`).join(' && '),
    }, _.fromPairs(tests)),
  },
}

