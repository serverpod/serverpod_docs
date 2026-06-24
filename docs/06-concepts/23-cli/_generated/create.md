## Usage

```console
Creates a new Serverpod project, specify project name (must be lowercase with no special characters).

Usage: serverpod create [arguments]
-h, --help                      Print this usage information.
-f, --force                     Create the project even if there are issues that prevent it from running out of the box.
-n, --name (mandatory)          The name of the project to create.
                                Can also be specified as the first argument.

Project Template
    --mini                      Shortcut for --template mini.
-t, --template                  Template to use when creating a new project

          [mini]                Mini project with minimal features and no database
          [server] (default)    Server project with standard features including database
          [module]              Serverpod Module project

Run "serverpod help" to see global options.
```
