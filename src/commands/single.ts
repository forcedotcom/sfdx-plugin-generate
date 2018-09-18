import AppCommand from '../app-command'

export default class extends AppCommand {
  static hidden = true
  static description = 'generate a new single-command CLI'
  type = 'single'
}
