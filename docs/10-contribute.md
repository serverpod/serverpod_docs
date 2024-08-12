# Roadmap & contributions

Serverpod is built by the community for the community. Pull requests are very much welcome. If you are making something more significant than just a tiny bug fix, please get in touch with Serverpod's lead developer [Viktor Lidholt](https://www.linkedin.com/in/viktorlidholt/) before you get started. This makes sure that your contribution aligns with Serverpod's overall vision and roadmap and that multiple persons don't do the same work.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/V3CqPx4jykE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Roadmap
If you want to contribute, please view our [roadmap](https://github.com/orgs/serverpod/projects/4) to make sure your contribution is in-line with our plans for future development. This will make it much more likely that we can include the new features you are building. You can also check our list of [good first issues](https://github.com/serverpod/serverpod/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

:::important

For us to be able to accept your code, you must follow the guidelines below. __We cannot accept contributions unless there are tests written for it.__ We also cannot accept features that are not complete for all use cases. In very rare circumstances, we may still be able to use code that doesn't comply with the guidelines, but it may take a long time for us to free up a resource that can clean up the code or write missing tests.

:::

## Working on Serverpod

The main [Serverpod repository](https://github.com/serverpod/serverpod) contains all Serverpod code and code for tests and official modules and integrations. Send any pull requests to the `main` branch.

### Writing code

We are very conscious about keeping the Serverpod code base clean. When you write your code, make sure to use `dart format` and that you don't get any errors or lints from `dart analyze`.

### Running all tests

Continuous integration tests are automatically run when sending a pull request to the `main` branch. You can run the tests locally by changing your working directory into the root serverpod directory and running:

```bash
$ util/run_tests
```

:::caution

Tests may not yet work if running on a Windows machine. Mac or Linux is recommended for Serverpod development.

:::

### Running individual tests

Running single individual tests is useful when you are working on a specific feature. To do it, you will need to manually start the test server, then run the integration tests from the `serverpod` package.

1. Add an entry for the test server at the end of your `/etc/hosts file`.

    ```text
    127.0.0.1 serverpod_test_server
    ```

2. Start the Docker container for the test server.

    ```bash
    $ cd tests/serverpod_test_server/docker-local
    $ docker-compose up --build --detach
    $ ./setup-tables
    ```

3. Start the test server.

    ```bash
    $ cd tests/serverpod_test_server
    $ dart bin/main.dart
    ```

4. Run an individual test

    ```bash
    $ cd tests/serverpod_test_server
    $ dart test test/connection_test.dart
    ```

### Command line tools

To run the `serverpod` command from your cloned repository, you will need to:

```bash
$ cd tools/serverpod_cli
$ dart pub get
$ dart pub global activate --source path .
```

Depending on your Dart version you may need to run the `dart pub global` command above every time you've made changes in the Serverpod tooling.

:::info

If you run the local version of the `serverpod` command line interface, you will need to set the `SERVERPOD_HOME` environment variable. It should point to the root your cloned `serverpod` monorepo. (E.g. `/Users/myuser/MyRepos/serverpod`)

If you use `serverpod create` to set up a new project with a local version of the tooling, you may need to edit the pubspec files in the created packages to point to your local serverpod packages.

:::

### Editing the pubspec.yaml files

First off, we are restrictive about which new packages we include in the Serverpod project. So before starting to add new dependencies, you should probably get in touch with the maintainers of Serverpod to clear it.

Secondly, you shouldn't edit the `pubspec.yaml` files directly. Instead, make changes to the files in the `templates/` directory. When you've made changes, run the `update_pubspecs` command to generate the `pubspec.yaml` files.

```bash
$ util/update_pubspecs
```

## Submitting your pull request

To keep commits clean, Serverpod squashes them when merging pull requests. Therefore, it is essential that each pull request only contains a single feature or bug fix. Keeping the pull requests smaller also makes it faster and easier to review the code.

If you are contributing new code, you will also need to provide tests for your code. The tests should be placed in the `tests/serverpod_test_server` package.

## Getting support

Feel free to post on [Serverpod's discussion board](https://github.com/serverpod/serverpod/discussions) if you have any questions. We check the board daily.


## Repository overview

Serverpod is a large project and contains many parts. Here is a quick overview of how Serverpod is structured and where to find relevant files.

### `packages`

Here, you find the core serverpod Dart packages.

- __`serverpod`__: Contains the main Serverpod package, the ORM, basic authentication, messaging, and cache. It also contains the endpoints of the Serverpod Insights API.
- __`serverpod_client`__: The client classes that are not generated by the CLI tooling.
- serverpod_flutter: Client code that relies on Flutter. It contains some concrete classes defined in serverpod_client.
- __`serverpod_serialization`__: Code for handling serialization, which is shared between the `serverpod` package and `serverpod_client`.
- __`serverpod_service_client`__: This is the generated API for Serverpod Insights.
- __`serverpod_shared`__: Code that is shared between serverpod and Serverpod's tooling (i.e., `serverpod_cli`).

### `templates`

The template directory contains templates for all pubspec files. To generate the real pubspec files from the templates, use the util/update_pubspecs script. The template directory also contains templates for the `serverpod create` command.

### `tools`

Here, you will find the code for Serverpod's tooling.

- __`serverpod_cli`__: Serverpod's command line interface. The CLI also contains code for Serverpod's analyzer and code generation.
- __`serverpod_vs_code_extension`__: The VS Code extension is built around the CLI.

### `modules`

These are 1st party modules for Serverpod. Currently, we maintain an authentication module and a chat module. Modules contain server, client, Flutter code, and definitions for database tables.

### `integrations`

These are integrations for 3rd party services, such as Cloud storage.