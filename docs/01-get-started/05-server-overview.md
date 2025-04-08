# Server overview

At first glance, the complexity of the server may seem daunting, but there are only a few directories and files you need to pay attention to. The rest of the files will be there when you need them in the future, e.g., when you want to deploy your server or if you want to set up continuous integration.

These are the most important directories:

- `config`: These are the configuration files for your Serverpod. These include a `password.yaml` file with your passwords and configurations for running your server in development, staging, and production. By default, everything is correctly configured to run your server locally.
- `lib/src/endpoints`: This is the default location for your server's endpoints. When you add methods to an endpoint, Serverpod will generate the corresponding methods in your client.
- `lib/src/models`: Default location for your model definition files. The files define the classes you can pass through your API and how they relate to your database. Serverpod generates serializable objects from the model definitions.

Both the `endpoints` and `models` directories contain sample files that give a quick idea of how they work. So this a great place to start learning.

## Generating code

Whenever you change your code in either the `endpoints` or `models` directory, you will need to regenerate the classes managed by Serverpod. Do this by running `serverpod generate`.

```bash
$ cd mypod/mypod_server
$ serverpod generate
```
