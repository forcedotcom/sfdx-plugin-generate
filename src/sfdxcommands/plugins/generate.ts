/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags } from '@oclif/core';

import Base from '../../command-base';

export default class Generate extends Base {
  public static readonly flags = {
    defaults: Flags.boolean({ description: 'use defaults for every setting' }),
    force: Flags.boolean({ description: 'overwrite existing files' }),
  };

  public static readonly args = [{ name: 'path', required: false }];

  public static description = 'create a new sfdx-cli plugin';
  public type = 'sfdx-plugin';

  public async run(): Promise<void> {
    const { flags: flagsGenerate, args } = await this.parse(Generate);

    await super.generate('app', {
      type: this.type,
      path: args.path as string,
      defaults: flagsGenerate.defaults,
      force: flagsGenerate.force,
      options: [],
    });
  }
}
