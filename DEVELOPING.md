## Pre-requisites

1.  We are using Node 8. If you need to work with multiple versions of Node, you
    might consider using [nvm](https://github.com/creationix/nvm).
1.  This repository uses [yarn](https://yarnpkg.com/) to manage node dependencies. Please install yarn globally using `npm install --global yarn`.

## Typical workflow

You would do this only once, after you initially clone the repository.

1.  Clone this repository from GitHub.
1.  `cd` into `sfdx-plugin-generate`.
1.  Check out the `develop` branch. We develop on the `develop` branch and release from the `master` branch. At
    this point, you should do initiate a `git checkout -t origin/develop`.
1.  `yarn` to bring in all the top-level dependencies.
1.  Open the project in your editor of choice.

When you are ready to commit

1.  We enforce a commit message format. We recommend using [commitizen](https://github.com/commitizen/cz-cli) by installing it with `yarn add --global commitizen` then commit using `git cz`, which will prompt you questions to format the commit message.
1.  Before commit and push, husky will run several hooks to ensure the message and that everything lints and compiles properly.

## List of Useful Commands

### `yarn compile`

This compiles the TypeScript to JavaScript.

### `yarn clean`

This cleans all generated files and directories. Running `yarn clean-all` will also clean up the `node_module` directories.

### `yarn test`

This tests the TypeScript using ts-node.

### `yarn lint`

This lints all the TypeScript. If there are no errors/warnings
from tslint, then you get a clean output. But, if there are errors from tslint,
you will see a long error that can be confusing; just focus on the tslint
errors. The results of this is deeper than what the tslint extension in VS Code
does because of [semantic lint
rules](https://palantir.github.io/tslint/usage/type-checking/), which requires a
`tsconfig.json` to be passed to tslint.
