/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'path';
import * as helpers from 'yeoman-test';
import * as shell from 'shelljs';
import { expect } from 'chai';

const isWindows = process.platform === 'win32';
const rmrf = isWindows ? 'rimraf' : 'rm -rf';
const rmf = isWindows ? 'rimraf' : 'rm -f';

const expectedPackageJSON = {
  name: 'sfdx-plugin-org',
  description: 'An sfdx plugin to create scratch orgs',
  author: 'John Doe',
  version: '0.0.1',
  license: 'MIT',
  files: ['/lib', '/messages', '/npm-shrinkwrap.json', '/oclif.manifest.json'],
  homepage: 'https://github.com/johndoe/sfdx-plugin-org',
  keywords: ['sfdx-plugin'],
  oclif: {
    commands: './lib/commands',
    bin: 'sfdx',
    topics: {
      hello: {
        description: 'Commands to say hello.',
      },
    },
    devPlugins: ['@oclif/plugin-help'],
  },
  repository: 'johndoe/sfdx-plugin-org',
  scripts: {
    build: 'tsc -p .',
    lint: 'eslint src/**/*.ts test/**/*.ts',
    postpack: `${rmf} oclif.manifest.json`,
    posttest: 'eslint src/**/*.ts test/**/*.ts',
    prepack: `${rmrf} lib && tsc -b && oclif-dev manifest && oclif-dev readme`,
    test: 'nyc --extension .ts --require ts-node/register mocha --forbid-only "test/**/*.test.ts"',
    version: 'oclif-dev readme && git add README.md',
  },
};

describe('sfdx:plugin generator', () => {
  let runResult: helpers.RunResult;

  after(async () => {
    shell.rm('-rf', runResult.cwd);
  });

  it('generates an sfdx plugin', async () => {
    const promptAnswers = {
      name: 'sfdx-plugin-org',
      description: 'An sfdx plugin to create scratch orgs',
      author: 'John Doe',
      version: '0.0.1',
      license: 'MIT',
      'github.user': 'johndoe',
      'github.repo': 'sfdx-plugin-org',
    };
    runResult = await helpers
      .run(path.join(__dirname, '../../../src/generators/app.ts'))
      .withOptions({ skipInstall: true })
      .withPrompts(promptAnswers)
      .toPromise();
  });

  it('generates a valid package.json', () => {
    expect(runResult.assertFile('package.json')).not.throw;
    expect(runResult.assertJsonFileContent('package.json', expectedPackageJSON)).not.throw;
  });

  it('generates config files', () => {
    const standardFiles = [
      '.gitignore',
      '.editorconfig',
      '.eslintrc.js',
      '.prettierrc.json',
      'README.md',
      'appveyor.yml',
      'tsconfig.json',
      'test/tsconfig.json',
      'test/mocha.json',
    ];
    expect(runResult.assertFile(standardFiles)).not.throw;
  });

  it('generates command and tests files', () => {
    const pluginFiles = [
      'src/commands/hello/org.ts',
      'src/index.ts',
      'test/commands/hello/org.test.ts',
      'messages/org.json',
    ];
    expect(runResult.assertFile(pluginFiles)).not.throw;
  });
});
