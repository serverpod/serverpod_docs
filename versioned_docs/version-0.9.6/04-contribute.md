# Contribute
Serverpod is built by the community for the community. Pull requests are very much welcome. If you are making something more significant than just a tiny bug fix, please get in touch with Serverpod's lead developer [Viktor Lidholt](https://www.linkedin.com/in/viktorlidholt/) before you get started. This makes sure that your contribution aligns with Serverpod's overall vision and roadmap and that multiple persons don't do the same work.

## Working on Serverpod
The main [Serverpod repository](https://github.com/serverpod/serverpod) contains all Serverpod code and code for tests and official modules and integrations. Send any pull requests to the `dev` branch.

### Writing code
We are very conscious about keeping the Serverpod code base clean. When you write your code, make sure to use `dart format` and that you don't get any errors or lints from `dart analyze`.

### Testing
Continuous integration tests are automatically run when sending a pull request to the `dev` branch. You can run the tests locally by changing your working directory into the root serverpod directory and running:

```bash
util/run_tests
```

We are currently refactoring the testing infrastructure to make it easier to run individual tests. We will update this documentation page as soon as that work is complete.

:::caution

Tests may not yet work if running on a Windows machine.

:::

### Command line tools
To run the `serverpod` command from your cloned repository, you will need to:

```bash
cd tools/serverpod_cli
dart pub get
dart pub global activate --source path .
```

Depending on your Dart version you may need to run the `dart pub global` command above every time you've made changes in the Serverpod tooling.

### Editing the pubspec.yaml files
First off, we are restrictive about which new packages we include in the Serverpod project. So before starting to add new dependencies you should probably get in touch with the maintainers of Serverpod to clear it.

Secondly, you shouldn't edit the `pubspec.yaml` files directly. Instead make changes to the files in the `templates/` directory. When you've made changes, run the command to generate new correct `pubspec.yaml` files:

```bash
util/update_pubspecs
```

## Getting support
Feel free to post on [Serverpod's discussion board](https://github.com/serverpod/serverpod/discussions) if you have any questions. We check the board daily.
