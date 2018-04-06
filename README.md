Salesforce Plugin Generator (Beta)
==================
<!-- toc -->
* [Description](#description)
* [Usage](#usage)
* [Salesforce CLI Plugin Development ](#salesforce-cli-plugin-development)
* [Plugin Generator Development](#plugin-generator-development)
* [Related Docs and Repositories](#related-docs-and-repositories)
<!-- tocstop -->

# Description

This is the generator plugin for building plugins for the Salesforce CLI. The generated sfdx plugin and command are built on top of the [oclif cli framework](https://github.com/oclif/oclif).
____
**As a beta feature, Salesforce Plugin Generator is a preview and isn’t part of the “Services” under your master subscription agreement with Salesforce. Use this feature at your sole discretion, and make your purchase decisions only on the basis of generally available products and features. Salesforce doesn’t guarantee general availability of this feature within any particular time frame or at all, and we can discontinue it at any time. This feature is for evaluation purposes only, not for production use. It’s offered as is and isn’t supported, and Salesforce has no liability for any harm or damage arising out of or in connection with it. All restrictions, Salesforce reservation of rights, obligations concerning the Services, and terms for related Non-Salesforce Applications and Content apply equally to your use of this feature. You can provide feedback and suggestions for Salesforce Plugin Generator in the [issues](TODO:replace-with-link-to-github-issues) section of this repo.**
____
# Usage

## Check Your Salesforce CLI Version
Starting with Salesforce CLI version 6.7.1, the plugin generator is offered as a core plugin and can be used out of the box. To check your Salesforce CLI version:
```sh-session
$ sfdx --version
```

## Generate a Salesforce CLI Plugin
Create and configure your own plugin for the Salesforce CLI. 

1. **Run `sfdx plugins:generate yourPluginName`.**  

    Unless you include the `--defaults` flag, you are prompted for information that's used to populate your new plugin. Answer the questions, or press Enter to use the default values. 
    ```sh-session
    $ sfdx plugins:generate yourPluginName
    ? npm package name (yourPluginName)
    ...
    Created yourPluginName in $HOME/<path-to-current-working-directory>/yourPluginName:
    ```

    The generator scaffolds a new sfdx plugin and installs the plugin's npm package dependencies.  

2. **Change directories into the newly created plugin directory.**
    ```sh-session
    $ cd yourPluginName
    ```
    The new plugin contains an example `hello:org` command. You can find the code for that command at `yourPluginName/src/commands/hello/org.ts`.  

3. **Run your `hello:org` command.**  

    This can be done in one of two ways:  
      * Link your new plugin to the Salesforce CLI. This installs the plugin in the Salesforce CLI by creating a symlink to the `yourPluginName` directory.
        ```sh-shell
        $ sfdx plugins:link
        ```
        With the plugin linked, you can see command details by adding the `-h` | `--help` flag.
        ```sh-session
        $ sfdx hello:org --help 
        USAGE
          $ sfdx hello:org [FILE]

        OPTIONS
          -f, --force
          -n, --name=name                                  name to print
          -u, --targetusername=targetusername              username or alias for the target org; overrides default target org
          -v, --targetdevhubusername=targetdevhubusername  username or alias for the dev hub org; overrides default dev hub org
          --apiversion=apiversion                          override the api version used for api requests made by this command
          --json                                           format output as json
          --loglevel=(trace|debug|info|warn|error|fatal)   logging level for this command invocation

        EXAMPLES
          $ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
            Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
            My hub org id is: 00Dxx000000001234

          $ sfdx hello:org --name myname --targetusername myOrg@example.com
            Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
        ```
      
      * Alternatively, you can run the `hello:org` command without linking it to the Salesforce CLI by using the provided `bin/run` script.
        ```sh-session
        $ bin/run hello:org --help
        USAGE
          $ sfdx hello:org [FILE]

        OPTIONS
          -f, --force
          -n, --name=name                                  name to print
          -u, --targetusername=targetusername              username or alias for the target org; overrides default target org
          -v, --targetdevhubusername=targetdevhubusername  username or alias for the dev hub org; overrides default dev hub org
          --apiversion=apiversion                          override the api version used for api requests made by this command
          --json                                           format output as json
          --loglevel=(trace|debug|info|warn|error|fatal)   logging level for this command invocation

        EXAMPLES
          $ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
            Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
            My hub org id is: 00Dxx000000001234

          $ sfdx hello:org --name myname --targetusername myOrg@example.com
            Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
        ```

Now you are ready to develop your own commands! 


# Salesforce CLI Plugin Development 
The generated `hello:org` command extends [sfdx-command](TODO:add-link), which in turn extends [oclif/command](https://github.com/oclif/command). When you build your own commands, you extend `sfdx-command` too. 
  
`sfdx-command` comes packed with functionality to speed up your command development and interact more easily with Salesforce DX projects and Salesforce orgs. `sfdx-command` uses features of [sfdx-core](TODO:add-link), which exposes Salesforce API functionality that's useful in command development. See these libraries' documentation pages for a full list of features. 
  
## Features
The `hello:org` command highlights a small subset of the features available through [sfdx-command](TODO:add-link), [sfdx-core](TODO:add-link), and [oclif](https://github.com/oclif/command). You can find the code for the `hello:org` command at `yourPluginName/src/commands/hello/org.ts`.

### Command Parameters
Add standard and custom parameters to your commands.

#### Automatic Parameter Generation
`sfdx-command` automatically enables the `--json` and `--loglevel` flags on every command to make continuous integration setup and debugging easier. 

#### Optional Parameter Generation

`sfdx-command` also includes functionality to help you set up connections with Salesforce orgs. For example, to enable the `--targetusername` parameter for your command:
```js
protected static requiresUsername = true;
```

Now, the command can access the org that has a specified target username.
```js
public async run(): Promise<any> {
  const org = this.org;
}
```

[TODO: link to sfdx-command flag docs]().

#### Custom Parameters
In addition to the `sfdx-command` parameters, you can specify your own custom parameters by setting the `flagsConfig` variable.

```js
protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: messages.getMessage('nameFlagDescription')}),
    force: flags.boolean({char: 'f'})
};
```
[TODO: link to custom flag configuration documentation]().

### Message Loading
The [sfdx-core](TODO: add link to sfdx-core messaging docs) APIs provide a framework for handling command messaging.
```js
core.Messages.importMessagesDirectory(pathToPluginRootDirectory);
const messages = core.Messages.loadMessages('yourPluginName', 'org');
```

### Topics 
As you add more commands to your CLI plugin, it can also be useful to nest your commands within topics. In the case of the generated plugin, `hello` is the topic and `org` is the command name. This structure was created by placing the `org.ts` file in the `hello` subdirectory.
```
package.json
src/
└── commands/
    └── hello/
        └── org.ts
```
See [oclif/oclif#-topics](https://github.com/oclif/oclif#-topics) for more information on how to structure your directories to utilize topics.

## Important Note for Plugin Command Developers
Because this is a TypeScript project, you need to compile the changes you make to your commands before running the commands. 

To compile your code and update the `.oclif.manifest.json` file that contains your command definitions, run:
```sh-session
yarn run prepare
```

## Debugging your plugin:
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of the generated plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command from the `myNewPlugin` directory:
1. Start the inspector
  
    * If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
        ```sh-session
        $ sfdx hello:org -u myOrg@example.com --dev-suspend
        ```
  
    * Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
        ```sh-session
        $ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
        ```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5). 
</br><img src=".images/vscodeScreenshot.png" width="480" height="278"></br>
Congrats, you are now debugging!
  
# Plugin Generator Development
To make changes to the plugin generator, follow these instructions.
=======
  
Note: Only Node 8+ is supported. If you are new to Node.js, use nvm to install node.
  
1. Start by cloning the repo.
    ```sh-session
    $ git clone TODO:update-with-repo
    ```
2. Change directories into the cloned repo.
    ```sh-session
    $ cd TODO:update-with-repo-name
    ```
3. If you don't have Node.js version 8 or above installed, install it now.
    ```sh-session
    $ nvm install v8.9.4
    ```
4. Install the Yarn package manager.
    ```sh-session
    $ npm install -g yarn
    ```
5. Install the plugin generator.
    ```sh-session
    $ yarn install
    ```
6. Compile the TypeScript code.
    ```sh-session
    $ yarn run build
    ```
7. Now you are ready to run the plugins:generate command and make any changes to the generator.
    ```sh-session
    $ bin/run plugins:generate yourPluginName
    ```

# Related Docs and Repositories
* [salesforcedx/sfdx-command](TODO:add-link) - Base Salesforce CLI command
* [salesforcedx/sfdx-core](TODO:add-link) - Helper API for working with a Salesforce DX project and managing Salesforce orgs 
* [@oclif/command](https://github.com/oclif/command) - Base command for oclif; this can be used directly without the generator
* [@oclif/config](https://github.com/oclif/config) - Most of the core setup for oclif lives here
* [@oclif/errors](https://github.com/oclif/errors) - Renders and logs errors from commands
* [@oclif/cli-ux](https://github.com/oclif/cli-ux) - Library for common CLI UI utilities
* [@oclif/test](https://github.com/oclif/test) - Test helper for oclif