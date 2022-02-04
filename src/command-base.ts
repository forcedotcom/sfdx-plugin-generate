import Command from '@oclif/command'
import {createEnv} from 'yeoman-environment'

export default abstract class CommandBase extends Command {
  protected async generate(type: string, generatorOptions = {}) {
    const env = createEnv()

    env.register(
      require.resolve(`./generators/${type}`),
      `sfdx:${type}`,
    )

    await new Promise((resolve, reject) => {
      env.run(`sfdx:${type}`, generatorOptions, (err: Error, results: any) => {
        if (err) reject(err)
        else resolve(results)
      })
    })
  }
}
