/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Command } from '@oclif/core';
import { createEnv } from 'yeoman-environment';

export default abstract class CommandBase extends Command {
  // eslint-disable-next-line class-methods-use-this
  protected async generate(type: string, generatorOptions = {}): Promise<void> {
    const env = createEnv();

    env.register(require.resolve(`./generators/${type}`), `sfdx:${type}`);

    await env.run(`sfdx:${type}`, generatorOptions);
  }
}
