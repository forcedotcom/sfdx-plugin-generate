import AppCommand from '../app_command'

export default class extends AppCommand {
  static hidden = true
  static description = 'generate a new single-command CLI'
  type = 'single'
}
