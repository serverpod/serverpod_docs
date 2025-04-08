# Serverpod documentation website

This is the code for Serverpod's official documentation. If you are contributing, please only edit files in the `docs` directory. The Serverpod team will handle any updates to existing versions if necessary. You can view the updated documentation by choosing the _Next_ option in the top menu bar.

We have a Makefile with all the common commands, but you can also work with npm directly.

### Using the Makefile

The project includes a Makefile that provides shortcuts for common tasks. You can see all available commands by running:

```bash
$ make help
```

This will display a list of all available commands and their descriptions. The Makefile includes commands for installation, starting the development server, creating versions, formatting markdown files, and cleaning build artifacts.

### Install

Make sure that you have Node.js installed on your computer.

```bash
$ cd serverpod_docs

# Using npm
$ npm install

# Or if you have Make installed, use this make command
$ make install
```

### Local Development

```bash
# Using npm
$ npm start

# Or if you have Make installed, use this make command
$ make start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Add version

Make sure that the documentation is all up-to-date then run:

```bash
# Using npm
$ npm run docusaurus docs:version X.X.X

# Or if you have Make installed, use this make command
$ make version VERSION=X.X.X
```

### Amend the latest version

If you need to make changes to the latest version, you can do so by removing the latest version from `versions.json` and adding it again running the create version command with the same version number.

```bash
# Using npm
$ npm run docusaurus docs:version X.X.X

# Or if you have Make installed, use this make command
$ make version VERSION=X.X.X
```

### Add redirects

To maintain link integrity when relocating or renaming documentation pages, it's recommended to implement redirects. This is facilitated by the `@docusaurus/plugin-client-redirects` plugin. Redirects can be configured in the `docusaurus.config.js` file, within the `redirects` section of the plugin configuration.

### Deploy

Once a PR is merged into the `main` branch of this repository, a GitHub action is triggered that builds the documentation and pushes the build to the `docs` directory within the `serverpod.github.io` repository. The built documentation is committed as a new commit to the `main` branch and is then deployed to Github pages by the `serverpod.github.io` repository.

### Formatting

To ensure consistent formatting, we use markdownlint [(VS Code Extension)](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)

Install the `markdownlint-cli` globally, by running the following command from your terminal:

```bash
# Using npm
$ npm install -g markdownlint-cli

# Or if you have Make installed, use this make command
$ make install-linter
```

Formatting is only enforced in `/serverpod_docs/docs/` directory so therefore you only need to run the markdownlint-cli in this folder with:

```bash
# Using npm
$ markdownlint './docs/**/*.md'

# Or if you have Make installed, use this make command
$ make format
```

### Manual build and deploy

To do this you need access to the Serverpod Github `serverpod.github.io` repository. Clone it next to the `serverpod_web` repo.

```bash
$ util/deploy
```
