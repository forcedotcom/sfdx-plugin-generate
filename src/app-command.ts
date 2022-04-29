/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags } from '@oclif/core';

import Base from './command-base';

export default abstract class AppCommand extends Base {
  public static readonly flags = {
    defaults: Flags.boolean({ description: 'use defaults for every setting' }),
    options: Flags.string({ description: '(yarn|typescript|tslint|mocha)' }),
    force: Flags.boolean({ description: 'overwrite existing files' }),
  };

  public static args = [
    { name: 'path', required: false, description: 'path to project, defaults to current directory' },
  ];

  abstract type: string;

  public async run(): Promise<void> {
    const { flags: AppCommandflags, args } = await this.parse(AppCommand);
    const options = AppCommandflags.options ? AppCommandflags.options.split(',') : [];

    await super.generate('app', {
      type: this.type,
      path: args.path as string,
      options,
      defaults: AppCommandflags.defaults,
      force: AppCommandflags.force,
    });
  }
}
