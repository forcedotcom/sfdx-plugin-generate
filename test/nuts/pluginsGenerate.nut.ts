/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'path';
import * as os from 'os';
import { execCmd } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import * as shell from 'shelljs';

let sfdxPluginDir: string;

describe('plugins:generate', () => {
  before(async () => {
    sfdxPluginDir = path.join(os.tmpdir(), Date.now().toString(), '/sfdxPlugin');
  });

  it('plugins:generate generates a valid sfdx plugin', async () => {
    const cmdOutput = execCmd(`plugins:generate --defaults ${sfdxPluginDir}`, {
      ensureExitCode: 0,
    });
    expect(cmdOutput.shellOutput.code).equals(0);
    expect(cmdOutput.shellOutput.stdout).includes('Created sfdxPlugin in');

    const shellJsOpts = {
      cwd: sfdxPluginDir,
    };

    const nyc = require.resolve('nyc/bin/nyc');
    const mocha = require.resolve('mocha/bin/mocha');

    const command = `node ${nyc} --extension .ts --require ts-node/register ${mocha} "test/**/*.test.ts"`;
    const sfdxPluginYarnTestOutput = shell.exec(command, shellJsOpts);
    expect(sfdxPluginYarnTestOutput.code, 'sfdx plugin: yarn test failed').equals(0);

    const sfdxPluginBinRunOutput = shell.exec('node ./bin/run hello:org --help', shellJsOpts);
    expect(sfdxPluginBinRunOutput.code, 'sfdx plugin: ./bin/run failed').equals(0);

    const sfdxPluginNpmPackOutput = shell.exec('npm pack --unsafe-perm', shellJsOpts);
    expect(sfdxPluginNpmPackOutput.code, 'sfdx plugin: npm pack failed').equals(0);
  });

  after(async () => {
    shell.rm('-rf', sfdxPluginDir);
  });
});
