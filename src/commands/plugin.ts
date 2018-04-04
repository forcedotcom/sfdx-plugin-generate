import AppCommand from '../app_command'

export default class extends AppCommand {
  static hidden = true
  static description = 'create a new CLI plugin'
  type = 'plugin'
}
