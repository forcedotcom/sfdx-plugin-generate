/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// eslint:disable no-floating-promises

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as Generator from 'yeoman-generator';
import { Options } from 'yeoman-environment';
import { AnyJson, JsonMap, get } from '@salesforce/ts-types';
import yosay = require('yosay');

import * as Debug from 'debug';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import sortPjson = require('sort-pjson');
const debug = Debug('generator-oclif');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packagejson = require('../../package.json') as AnyJson;
const version = get(packagejson, 'version') as string;

const isWindows = process.platform === 'win32';
const rmrf = isWindows ? 'rimraf' : 'rm -rf';
const rmf = isWindows ? 'rimraf' : 'rm -f';

let successfullyInstalledDeps = false;

interface IPjson {
  name?: string;
  description?: string;
  author?: string;
  homepage?: string;
  bugs?: string;
  version?: string;
  license?: string;
  files?: string[];
  repository?: string;
  dependencies?: AnyJson;
  devDependencies?: AnyJson;
  oclif?: {
    commands?: string;
    bin?: string;
    dirname?: string;
    topics?: AnyJson;
    plugins: string[];
    devPlugins: string[];
  };
  scripts?: {
    test?: AnyJson;
    prepack?: AnyJson;
    build?: AnyJson;
    lint?: AnyJson;
    posttest?: AnyJson;
    postpack?: AnyJson;
    version?: AnyJson;
  };
  keywords?: string[];
  engines?: JsonMap;
}

interface IAnswers {
  name: string;
  description: string;
  version: string;
  github?: { repo: string; user: string };
  author: string;
  license: string;
}

class App extends Generator {
  public options: {
    defaults?: boolean;
    skipInstall?: boolean;
  };

  public repository?: string;

  private path: string;
  private pjson: IPjson;
  private githubUser: string | undefined;
  private answers!: IAnswers;

  // eslint-disable-next-line no-underscore-dangle
  private get _bin(): string {
    // eslint-disable-next-line no-mixed-operators

    let bin = (this.pjson.oclif && (this.pjson.oclif.bin || this.pjson.oclif.dirname)) || this.pjson.name;
    if (bin.includes('/')) bin = bin.split('/').pop();
    return bin;
  }

  public constructor(args: string | string[], opts: Options) {
    super(args, opts, {
      customInstallTask: true,
    });

    this.path = opts.path as string;
    this.options = {
      defaults: opts.defaults as boolean,
      skipInstall: (opts.skipInstall as boolean) || false,
    };
  }

  public async prompting(): Promise<void> {
    this.log(yosay(`Time to build an sfdx-cli plugin! Version: ${version}`));

    if (this.path) {
      this.destinationRoot(path.resolve(this.path));
      process.chdir(this.destinationRoot());
    }

    try {
      this.githubUser = await this.user.github.username();
    } catch (error) {
      debug(error);
    }

    let repository = this.destinationRoot().split(path.sep).slice(-2).join('/');
    if (this.githubUser) repository = `${this.githubUser}/${repository.split('/')[1]}`;

    this.pjson = {
      keywords: ['sfdx-plugin'],
      files: ['/lib', '/messages', '/npm-shrinkwrap.json', '/oclif.manifest.json'],
      engines: {
        node: '>=12.0.0',
      },
      scripts: {
        posttest: 'eslint src/**/*.ts test/**/*.ts',
        test: 'nyc --extension .ts --require ts-node/register mocha --forbid-only "test/**/*.test.ts"',
        prepack: `${rmrf} lib && tsc -b && oclif-dev manifest && oclif-dev readme`,
        build: 'tsc -p .',
        lint: 'eslint src/**/*.ts test/**/*.ts',
        postpack: `${rmf} oclif.manifest.json`,
        version: 'oclif-dev readme && git add README.md',
      },
    };

    const defaultAnswers: IAnswers = {
      name: this.determineAppname().replace(/ /g, '-'),
      description: '',
      version: '0.0.0',
      license: 'MIT',
      author: this.githubUser ? `${this.user.git.name()} @${this.githubUser}` : this.user.git.name(),
    };

    this.answers = this.options.defaults
      ? defaultAnswers
      : ((await this.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'npm package name',
            default: defaultAnswers.name,
            when: !this.pjson.name,
          },
          {
            type: 'input',
            name: 'description',
            message: 'description',
            when: !this.pjson.description,
          },
          {
            type: 'input',
            name: 'author',
            message: 'author',
            default: defaultAnswers.author,
            when: !this.pjson.author,
          },
          {
            type: 'input',
            name: 'version',
            message: 'version',
            default: defaultAnswers.version,
            when: !this.pjson.version,
          },
          {
            type: 'input',
            name: 'license',
            message: 'license',
            default: defaultAnswers.license,
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
            default: (answers: { name: string }): string =>
              (this.pjson.repository || answers.name || this.pjson.name).split('/').pop(),
            when: !this.pjson.repository,
          },
        ])) as IAnswers);
    debug(this.answers);

    this.pjson.name = this.answers.name;
    this.pjson.description = this.answers.description;
    this.pjson.version = this.answers.version;
    this.pjson.author = this.answers.author;
    this.pjson.license = this.answers.license;
    this.pjson.repository = this.answers.github
      ? `${this.answers.github.user}/${this.answers.github.repo}`
      : repository;

    this.pjson.homepage = `https://github.com/${this.pjson.repository}`;
    this.pjson.bugs = `https://github.com/${this.pjson.repository}/issues`;
  }

  public writing(): void {
    this.env.cwd = process.cwd();
    this.env.options.nodePackageManager = 'yarn';
    this.sourceRoot(path.join(__dirname, '../../templates'));

    this.pjson.oclif = {
      commands: './lib/commands',
      bin: 'sfdx',
      topics: {
        hello: {
          description: 'Commands to say hello.',
        },
      },
      ...this.pjson.oclif,
    };

    if (!this.pjson.oclif.devPlugins) {
      this.pjson.oclif.devPlugins = ['@oclif/plugin-help'];
    }

    if (this.pjson.oclif && Array.isArray(this.pjson.oclif.plugins)) {
      this.pjson.oclif.plugins.sort();
    }

    this.fs.copyTpl(
      this.templatePath('sfdxPlugin/test/tsconfig.json'),
      this.destinationPath('test/tsconfig.json'),
      this
    );

    this.fs.copyTpl(this.templatePath('test/mocha.json'), this.destinationPath('test/mocha.json'), this);

    this.fs.copyTpl(this.templatePath('editorconfig'), this.destinationPath('.editorconfig'), this);

    this.fs.copyTpl(this.templatePath('circle.yml.ejs'), this.destinationPath('.circleci/config.yml'), this);

    this.fs.copyTpl(this.templatePath('appveyor.yml.ejs'), this.destinationPath('appveyor.yml'), this);

    this.fs.copyTpl(this.templatePath('README.md.ejs'), this.destinationPath('README.md'), this);

    if (
      this.pjson.license === 'MIT' &&
      (this.pjson.repository.startsWith('oclif') || this.pjson.repository.startsWith('heroku'))
    ) {
      this.fs.copyTpl(this.templatePath('LICENSE.mit'), this.destinationPath('LICENSE'), this);
    }

    // eslint-disable-next-line no-underscore-dangle
    this.fs.write(this.destinationPath('.gitignore'), this._gitignore());

    // eslint-disable-next-line no-underscore-dangle
    this._writeSfdxPlugin();

    // dependencies
    let dependencies = {};
    let devDependencies = {};

    dependencies = {
      ...dependencies,
      '@oclif/command': '^1',
      '@oclif/config': '^1',
      '@oclif/errors': '^1',
      '@salesforce/command': '^4',
      '@salesforce/core': '^2',
      tslib: '^2',
    };
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
    };

    if (isWindows) devDependencies = { ...devDependencies, rimraf: 'latest' };
    this.pjson.dependencies = dependencies;
    this.pjson.devDependencies = devDependencies;

    // Merge `this.pjson` and write file
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.packageJson.merge(sortPjson(this.pjson));
  }

  public async install(): Promise<void> {
    if (this.options.skipInstall) {
      return;
    }
    const yarnOpts: AnyJson = {};
    if (process.env.YARN_MUTEX) yarnOpts.mutex = process.env.YARN_MUTEX;

    try {
      await this.spawnCommand('yarn', ['install'], yarnOpts);
      successfullyInstalledDeps = true;
    } catch {
      // eslint-disable-next-line no-console
      console.log('Could not finish installation. \nPlease install yarn with npm install -g yarn and try again.');
    }
  }

  public end(): void {
    if (successfullyInstalledDeps) {
      this.spawnCommandSync(path.join('.', 'node_modules/.bin/oclif-dev'), ['readme']);
    }

    // eslint-disable-next-line no-console
    console.log(`\nCreated ${this.pjson.name} in ${this.destinationRoot()}`);
  }

  // eslint-disable-next-line no-underscore-dangle
  private _gitignore(): string {
    const existing = this.fs.exists(this.destinationPath('.gitignore'))
      ? this.fs.read(this.destinationPath('.gitignore')).split('\n')
      : [];
    return (
      _(['*-debug.log', '*-error.log', 'node_modules', '/tmp', '/dist', '/.nyc_output', '/package-lock.json', '/lib'])
        .concat(existing)
        .compact()
        .uniq()
        .sort()
        .join('\n') + '\n'
    );
  }

  // eslint-disable-next-line no-underscore-dangle
  private _writeSfdxPlugin(): void {
    const sfdxExampleCommand = 'org';
    const topic = 'hello';
    // eslint-disable-next-line no-underscore-dangle
    const bin = this._bin;
    const cmd = `${bin} ${sfdxExampleCommand}`;
    const opts = { ...this, _, bin, cmd };
    this.fs.copyTpl(this.templatePath('plugin/bin/run'), this.destinationPath('bin/run'), opts);
    this.fs.copyTpl(this.templatePath('bin/run.cmd'), this.destinationPath('bin/run.cmd'), opts);
    this.fs.copyTpl(this.templatePath('sfdxPlugin/README.md.ejs'), this.destinationPath('README.md'), this);
    this.fs.copy(
      this.templatePath('.images/vscodeScreenshot.png'),
      this.destinationPath('.images/vscodeScreenshot.png')
    );
    this.fs.copyTpl(this.templatePath('sfdxPlugin/.eslintrc.js'), this.destinationPath('.eslintrc.js'), this);
    this.fs.copyTpl(this.templatePath('sfdxPlugin/tsconfig.json'), this.destinationPath('tsconfig.json'), this);
    this.fs.copyTpl(this.templatePath('sfdxPlugin/.prettierrc.json'), this.destinationPath('.prettierrc.json'), this);
    if (!fs.existsSync('src/commands')) {
      this.fs.copyTpl(
        this.templatePath('src/sfdxCommand.ts.ejs'),
        this.destinationPath(`src/commands/${topic}/${sfdxExampleCommand}.ts`),
        {
          ...opts,
          pluginName: this.pjson.name,
          commandName: sfdxExampleCommand,
          topicName: topic,
        }
      );
    }

    this.fs.copyTpl(this.templatePath('sfdxPlugin/src/index.ts'), this.destinationPath('src/index.ts'), opts);
    if (!fs.existsSync('test')) {
      this.fs.copyTpl(
        this.templatePath('sfdxPlugin/test/command.test.ts.ejs'),
        this.destinationPath(`test/commands/${topic}/${sfdxExampleCommand}.test.ts`),
        { ...opts, name: sfdxExampleCommand, topic }
      );
    }

    if (!fs.existsSync('messages/messages.json')) {
      this.fs.copyTpl(
        this.templatePath('messages/messages.json'),
        this.destinationPath(`messages/${sfdxExampleCommand}.json`),
        this
      );
    }

    if (!fs.existsSync('.vscode/launch.json')) {
      this.fs.copyTpl(this.templatePath('.vscode/launch.json'), this.destinationPath('.vscode/launch.json'), this);
    }

    if (!fs.existsSync('.vscode/settings.json')) {
      this.fs.copyTpl(this.templatePath('.vscode/settings.json'), this.destinationPath('.vscode/settings.json'), this);
    }

    if (!fs.existsSync('.vscode/tasks.json')) {
      this.fs.copyTpl(this.templatePath('.vscode/tasks.json'), this.destinationPath('.vscode/tasks.json'), this);
    }
  }
}

export = App;
