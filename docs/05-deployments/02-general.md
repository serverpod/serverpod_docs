# General notes
Serverpod comes with a set of Terraform scripts that makes it very easy to deploy your server. We currently support deployments to AWS, but hope to support more platforms (like Google Cloud) in the future.

## Configuration files
Serverpod has three main configuration files, depending on which mode the server is running; `development`, `staging`, or `production`. The files are located in the `config/` directory. By default, the server will start in development mode. To use another configuration file, use the `--mode` option when starting the server. If you are running multiple servers in a cluster, use the `--server-id` option to specify the id of each server. By default, the server will run as id `default`. For instance, to start the server in production mode with id `2`, run the following command:

```bash
dart bin/main.dart --mode production --server-id 2
```

:::info

It may be totally valid to run all servers with the same id. If you are using something like AWS Fargate it's hard to configure individual server ids.

:::

Depending on how memory intensive the server is and how many requests it is serving at peak times, you may want to increase the maximum heap size Dart can use. You can do this by passing the `--old_gen_heap_size` option to dart. If you set it to `0` it will give Dart unlimited heap space. Serverpod will run on most operating systems where you can run Dart; Flutter is not required.

## Running a cluster of servers
To run a cluster of servers, you need to place your servers behind a load balancer so that they have a common access point to the main API port. If you want to gather runtime information from the servers, the service port needs to be accessible not only between servers in the cluster but also from the outside. You will most likely want to add an HTTPS certificate to your load balancer to make sure all communication with clients is encrypted.

## Required services
Serverpod will not run without a link to a Postgres database with the correct tables added. Serverpod can also use Redis, you will need to manually enable Redis in your configuration files.
