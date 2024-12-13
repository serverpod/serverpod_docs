# Modules
Serverpod is built around the concept of modules. A Serverpod module is similar to a Dart package but contains both server and client code and Flutter widgets. A module contains its own namespace for endpoints and methods to minimize module conflicts.

Examples of modules are the `serverpod_auth` module and the `serverpod_chat` module, which both are maintained by the Serverpod team.

## Adding a module to your project
### Database setup
Each module comes with a set of database tables. You must add these to your database for the module to work. The code for creating the tables lives in the `generated/tables.pgsql` file of the `server` part of the module. For instance, you can find the database tables for the auth module [here](https://github.com/serverpod/serverpod/blob/main/modules/serverpod_auth/serverpod_auth_server/generated/tables.pgsql).

### Server setup
To add a module to your project, you must include the server and client/Flutter packages in your project's `pubspec.yaml` files and to add an entry to your `config/generator.yaml` file.

For example, to add the `serverpod_auth` module to your project, you need to add `serverpod_auth_server` to your server's `pubspec.yaml`:

```yaml
dependencies:
  serverpod_auth_server: ^1.x.x
```

:::info

Make sure to replace `1.x.x` with the Serverpod version you are using. Serverpod uses the same version number for all official packages. If you use the same version, you will be sure that everything works together.

:::

In your `config/generator.yaml` add the `serverpod_auth` module and give it a `nickname`. The nickname will determine how you reference the module from the client.

```yaml
modules:
  serverpod_auth:
    nickname: auth
```

Finally, you need to run `pub get` and `serverpod generate` from your server's directory (e.g., `mypod_server`) to add the module to your protocol.

```bash
dart pub get
serverpod generate
```

### Client setup
In your client's `pubspec.yaml`, you will need to add the generated client code from the module.

```yaml
dependencies:
  serverpod_auth_client: ^1.x.x
```

### Flutter app setup
In your Flutter app, add the corresponding dart or Flutter package(s) to your `pubspec.yaml`.

```yaml
dependencies:
  serverpod_auth_shared_flutter: ^1.x.x
  serverpod_auth_google_flutter: ^1.x.x
  serverpod_auth_apple_flutter: ^1.x.x
```

## Referencing a module
It can be useful to reference serializable objects in other modules from the YAML-files in your protocol directory. You do this by adding the module prefix, followed by the nickname of the package. For instance, this is how you reference a serializable class in the auth package.

```yaml
class: MyClass
fields:
  userInfo: module:auth:UserInfo
```

## Creating custom modules
With the `serverpod create` command, it is possible to create new modules for code that is shared between projects or that you want to publish to pub.dev. To create a module instead of a server project, pass `module` to the `--template` flag.

```bash
serverpod create --template module my_module
```

The create command will create a server and a client Dart package. If you also want to add custom Flutter code, use `flutter create` to create a package.

```bash
flutter create --template package my_module_flutter
```

In your Flutter package, you most likely want to import the client libraries created by `serverpod create`.

:::info

Most modules will need a set of database tables to function. When naming the tables, you should use the module name as a prefix to the table name to avoid any conflicts. For instance, the Serverpod tables are prefixed with `serverpod_`.

:::
