// eslint:disable no-floating-promises
// eslint:disable no-console

import * as fs from 'node:fs'
import * as _ from 'lodash'
import * as path from 'node:path'
import * as Generator from 'yeoman-generator'
import yosay = require('yosay')

const sortPjson = require('sort-pjson')
const debug = require('debug')('generator-oclif')
const {version} = require('../../package.json')

const isWindows = process.platform === 'win32'
const rmrf = isWindows ? 'rimraf' : 'rm -rf'
const rmf = isWindows ? 'rimraf' : 'rm -f'

let successfullyInstalledDeps = false

class App extends Generator {
  options: {
    defaults?: boolean
    circleci: boolean
  }

  path: string
  pjson: any
  githubUser: string | undefined
  answers!: {
    name: string
    bin: string
    description: string
    version: string
    github: {repo: string, user: string}
    author: string
    files: string
    license: string
    pkg: string
    typescript: boolean
    tslint: boolean
    eslint: boolean
    mocha: boolean
    ci: {
      circleci: boolean
    }
  }

  mocha!: boolean
  circleci!: boolean
  ts!: boolean
  tslint!: boolean
  eslint!: boolean
  yarn!: boolean

  get _bin() {
    // eslint-disable-next-line no-mixed-operators
    let bin = this.pjson.oclif && (this.pjson.oclif.bin || this.pjson.oclif.dirname) || this.pjson.name
    if (bin.includes('/')) bin = bin.split('/').pop()
    return bin
  }

  repository?: string

  constructor(args: any, opts: any) {
    super(args, opts, {
      customInstallTask: true,
    })

    this.path = opts.path
    this.options = {
      defaults: opts.defaults,
      circleci: opts.options.includes('circleci'),
    }
  }

  async prompting() {
    this.log(yosay(`Time to build an sfdx-cli plugin! Version: ${version}`))

    if (this.path) {
      this.destinationRoot(path.resolve(this.path))
      process.chdir(this.destinationRoot())
    }

    try {
      this.githubUser = await this.user.github.username()
    } catch (error) {
      debug(error)
    }

    this.pjson = {
      scripts: {},
      engines: {},
      oclif: {},
    }
    let repository = this.destinationRoot().split(path.sep).slice(-2).join('/')
    if (this.githubUser) repository = `${this.githubUser}/${repository.split('/')[1]}`
    const defaults = {
      name: this.determineAppname().replace(/ /g, '-'),
      version: '0.0.0',
      license: 'MIT',
      author: this.githubUser ? `${this.user.git.name()} @${this.githubUser}` : this.user.git.name(),
      dependencies: {},
      repository,
      ...this.pjson,
      engines: {
        node: '>=12.0.0',
        ...this.pjson.engines,
      },
      options: this.options,
    }
    this.repository = defaults.repository
    if (this.repository && (this.repository as any).url) {
      this.repository = (this.repository as any).url
    }

    this.answers = this.options.defaults ? defaults : await this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'npm package name',
        default: defaults.name,
        when: !this.pjson.name,
      },
      {
        type: 'input',
        name: 'description',
        message: 'description',
        default: defaults.description,
        when: !this.pjson.description,
      },
      {
        type: 'input',
        name: 'author',
        message: 'author',
        default: defaults.author,
        when: !this.pjson.author,
      },
      {
        type: 'input',
        name: 'version',
        message: 'version',
        default: defaults.version,
        when: !this.pjson.version,
      },
      {
        type: 'input',
        name: 'license',
        message: 'license',
        default: defaults.license,
        when: !this.pjson.license,
      },
      {
        type: 'input',
        name: 'github.user',
        message: 'Who is the GitHub owner of repository (https://github.com/OWNER/repo)',
        default: repository.split('/').slice(0, -1).pop(),
        when: !this.pjson.repository,
      },
      {
        type: 'input',
        name: 'github.repo',
        message: 'What is the GitHub name of repository (https://github.com/owner/REPO)',
        default: (answers: any) => (this.pjson.repository || answers.name || this.pjson.name).split('/').pop(),
        when: !this.pjson.repository,
      },
    ]) as any
    debug(this.answers)

    this.pjson.name = this.answers.name || defaults.name
    this.pjson.description = this.answers.description || defaults.description
    this.pjson.version = this.answers.version || defaults.version
    this.pjson.engines.node = defaults.engines.node
    this.pjson.author = this.answers.author || defaults.author
    this.pjson.files = this.answers.files || defaults.files || ['/lib']
    this.pjson.license = this.answers.license || defaults.license
    this.pjson.repository = this.answers.github ? `${this.answers.github.user}/${this.answers.github.repo}` : defaults.repository
    this.repository = this.pjson.repository
    this.pjson.scripts.posttest = 'eslint .'

    this.pjson.scripts.test = 'nyc --extension .ts --require ts-node/register mocha --forbid-only "test/**/*.test.ts"'
    this.pjson.scripts.prepack = `${rmrf} lib && tsc -b`
    this.pjson.scripts.build = 'tsc -p .'

    this.pjson.scripts.lint = 'eslint src/**/*.ts test/**/*.ts'
    this.pjson.scripts.posttest = 'eslint src/**/*.ts test/**/*.ts'
    this.pjson.scripts.prepack = `${this.pjson.scripts.prepack} && oclif-dev manifest && oclif-dev readme`
    this.pjson.scripts.postpack = `${rmf} oclif.manifest.json`
    this.pjson.scripts.version = 'oclif-dev readme && git add README.md'
    this.pjson.files.push('/oclif.manifest.json', '/npm-shrinkwrap.json', '/messages')

    const keywords = 'sfdx-plugin'

    this.pjson.keywords = defaults.keywords || [keywords]
    this.pjson.homepage = defaults.homepage || `https://github.com/${this.pjson.repository}`
    this.pjson.bugs = defaults.bugs || `https://github.com/${this.pjson.repository}/issues`
  }

  writing() {
    this.env.cwd = process.cwd()
    this.env.options.nodePackageManager = 'yarn'
    this.sourceRoot(path.join(__dirname, '../../templates'))

    this.pjson.oclif = {
      commands: './lib/commands',
      bin: 'sfdx',
      topics: {
        hello: {
          description: 'Commands to say hello.',
        },
      },
      ...this.pjson.oclif,
    }

    if (!this.pjson.oclif.devPlugins) {
      this.pjson.oclif.devPlugins = [
        '@oclif/plugin-help',
      ]
    }

    if (this.pjson.oclif && Array.isArray(this.pjson.oclif.plugins)) {
      this.pjson.oclif.plugins.sort()
    }

    this.fs.copyTpl(this.templatePath('sfdxPlugin/test/tsconfig.json'), this.destinationPath('test/tsconfig.json'), this)

    this.fs.copyTpl(this.templatePath('test/mocha.json'), this.destinationPath('test/mocha.json'), this)

    if (_.isEmpty(this.pjson.oclif)) delete this.pjson.oclif
    this.pjson.files = _.uniq((this.pjson.files || []).sort())

    this.fs.copyTpl(this.templatePath('editorconfig'), this.destinationPath('.editorconfig'), this)

    this.fs.copyTpl(this.templatePath('circle.yml.ejs'), this.destinationPath('.circleci/config.yml'), this)

    this.fs.copyTpl(this.templatePath('appveyor.yml.ejs'), this.destinationPath('appveyor.yml'), this)

    this.fs.copyTpl(this.templatePath('README.md.ejs'), this.destinationPath('README.md'), this)

    if (this.pjson.license === 'MIT' && (this.pjson.repository.startsWith('oclif') || this.pjson.repository.startsWith('heroku'))) {
      this.fs.copyTpl(this.templatePath('LICENSE.mit'), this.destinationPath('LICENSE'), this)
    }

    this.fs.write(this.destinationPath('.gitignore'), this._gitignore())

    this._writeSfdxPlugin()

    // dependencies
    let dependencies = {}
    let devDependencies = {}

    dependencies = {
      ...dependencies,
      '@oclif/command': '^1',
      '@oclif/config': '^1',
      '@oclif/errors': '^1',
      '@salesforce/command': '^4',
      '@salesforce/core': '^2',
      tslib: '^2',
    }
    devDependencies = {
      ...devDependencies,
      '@oclif/dev-cli': '^1',
      '@oclif/plugin-help': '^3',
      globby: '^11',
      '@salesforce/dev-config': '^2',
      '@salesforce/dev-scripts': '^0',
      '@salesforce/prettier-config': '^0',
      '@salesforce/ts-sinon': '^1',
      '@types/jsforce': '^1.9.29',
      '@typescript-eslint/eslint-plugin': '^4',
      '@typescript-eslint/parser': '^4',
      'eslint-config-prettier': '^8',
      'eslint-config-salesforce': '^0',
      'eslint-config-salesforce-typescript': '^0',
      'eslint-plugin-header': '^3',
      'eslint-plugin-import': '^2',
      'eslint-plugin-jsdoc': '^35',
      'eslint-plugin-prettier': '^3',
      'eslint-plugin-typescript': '^0',
      husky: '^4',
      prettier: '^2',
      'pretty-quick': '^3',
      'ts-node': '^10',
      typescript: '4',
      mocha: '^8',
      nyc: '^15',
      chai: '^4',
      sinon: '10.0.0',
      '@oclif/test': '^1',
      '@types/chai': '^4',
      '@types/mocha': '^8',
      eslint: '^7',
      'eslint-config-oclif': '^3.1',
    }

    if (isWindows) devDependencies = {...devDependencies, rimraf: 'latest'}
    this.pjson.dependencies = dependencies
    this.pjson.devDependencies = devDependencies

    // Merge `this.pjson` and write file
    this.packageJson.merge(sortPjson(this.pjson))
  }

  async install() {
    const yarnOpts = {} as any
    if (process.env.YARN_MUTEX) yarnOpts.mutex = process.env.YARN_MUTEX

    try {
      await this.spawnCommand('yarn', ['install'], yarnOpts)
      successfullyInstalledDeps = true
    } catch {
      console.log('Could not finish installation. \nPlease install yarn with npm install -g yarn and try again.')
    }
  }

  end() {
    if (successfullyInstalledDeps) {
      this.spawnCommandSync(path.join('.', 'node_modules/.bin/oclif-dev'), ['readme'])
    }

    console.log(`\nCreated ${this.pjson.name} in ${this.destinationRoot()}`)
  }

  private _gitignore(): string {
    const existing = this.fs.exists(this.destinationPath('.gitignore')) ? this.fs.read(this.destinationPath('.gitignore')).split('\n') : []
    return _([
      '*-debug.log',
      '*-error.log',
      'node_modules',
      '/tmp',
      '/dist',
      '/.nyc_output',
      '/package-lock.json',
      '/lib',
    ])
    .concat(existing)
    .compact()
    .uniq()
    .sort()
    .join('\n') + '\n'
  }

  private _writeSfdxPlugin() {
    const sfdxExampleCommand = 'org'
    const topic = 'hello'
    const bin = this._bin
    const cmd = `${bin} ${sfdxExampleCommand}`
    const opts = {...this as any, _, bin, cmd}
    this.fs.copyTpl(this.templatePath('plugin/bin/run'), this.destinationPath('bin/run'), opts)
    this.fs.copyTpl(this.templatePath('bin/run.cmd'), this.destinationPath('bin/run.cmd'), opts)
    this.fs.copyTpl(this.templatePath('sfdxPlugin/README.md.ejs'), this.destinationPath('README.md'), this)
    this.fs.copy(this.templatePath('.images/vscodeScreenshot.png'), this.destinationPath('.images/vscodeScreenshot.png'))
    this.fs.copyTpl(this.templatePath('sfdxPlugin/.eslintrc.js'), this.destinationPath('.eslintrc.js'), this)
    this.fs.copyTpl(this.templatePath('sfdxPlugin/tsconfig.json'), this.destinationPath('tsconfig.json'), this)
    this.fs.copyTpl(this.templatePath('sfdxPlugin/.prettierrc.json'), this.destinationPath('.prettierrc.json'), this)
    if (!fs.existsSync('src/commands')) {
      this.fs.copyTpl(this.templatePath('src/sfdxCommand.ts.ejs'), this.destinationPath(`src/commands/${topic}/${sfdxExampleCommand}.ts`), {
        ...opts,
        pluginName: this.pjson.name,
        commandName: sfdxExampleCommand,
        topicName: topic,
      })
    }

    this.fs.copyTpl(this.templatePath('sfdxPlugin/src/index.ts'), this.destinationPath('src/index.ts'), opts)
    if (!fs.existsSync('test')) {
      this.fs.copyTpl(this.templatePath('sfdxPlugin/test/command.test.ts.ejs'), this.destinationPath(`test/commands/${topic}/${sfdxExampleCommand}.test.ts`), {...opts, name: sfdxExampleCommand, topic})
    }

    if (!fs.existsSync('messages/messages.json')) {
      this.fs.copyTpl(this.templatePath('messages/messages.json'), this.destinationPath(`messages/${sfdxExampleCommand}.json`), this)
    }

    if (!fs.existsSync('.vscode/launch.json')) {
      this.fs.copyTpl(this.templatePath('.vscode/launch.json'), this.destinationPath('.vscode/launch.json'), this)
    }

    if (!fs.existsSync('.vscode/settings.json')) {
      this.fs.copyTpl(this.templatePath('.vscode/settings.json'), this.destinationPath('.vscode/settings.json'), this)
    }

    if (!fs.existsSync('.vscode/tasks.json')) {
      this.fs.copyTpl(this.templatePath('.vscode/tasks.json'), this.destinationPath('.vscode/tasks.json'), this)
    }
  }
}

export = App
