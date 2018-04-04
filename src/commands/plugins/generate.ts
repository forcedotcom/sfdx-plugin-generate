import Base from '../../command_base'
import {flags} from '@oclif/command'

export default class Generate extends Base {
  static flags = {
    defaults: flags.boolean({description: 'use defaults for every setting'}),
    force: flags.boolean({description: 'overwrite existing files'}),
  }

  static args = [
    {name: 'path', required: false}
  ]

  static description = 'create a new sfdx-cli plugin'
  type = 'sfdx-plugin'

  async run() {
    const {flags, args} = this.parse(Generate)

    await super.generate('app', {
      type: this.type,
      path: args.path,
      defaults: flags.defaults,
      force: flags.force,
      options: []
    })
  }
}
