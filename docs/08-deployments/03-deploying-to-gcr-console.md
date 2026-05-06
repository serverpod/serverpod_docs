# Google Cloud Run with CGP Console

If your server does not maintain a state and you aren't using future calls, running your Serverpod on Google Cloud Run can be a great option. Cloud Run is the easiest way to deploy your server but may be less flexible as your application grows. Check the [Choosing deployment strategy](deployment-strategy) page for more information on choosing the best solution for your needs.

## Before you begin

Before you begin, you will need to install and configure the Google Cloud CLI tools.

- Create a new project with billing enabled. Learn how to check if billing is enabled [here](https://cloud.google.com/billing/docs/how-to/verify-billing-enabled)
- [Install](https://cloud.google.com/sdk/docs/install) the Google Cloud CLI.
- To [initialize](https://cloud.google.com/sdk/docs/initializing) the gcloud CLI, run the following command:

```bash
$ gcloud init
```

- To set the default project for your Cloud Run service:

```bash
$ gcloud config set project <PROJECT_ID>
```

## Setup the database

Before deploying your server, you must give it access to a Postgres database. Navigate to SQL, activate the API, then click _Create Instance_. Choose _PostgreSQL_. Pick a name for the database.

There are many configurations you can make, pick the ones that are best for your project, but make sure to:

- Use the production database password from your `config/passwords.yaml` file for the admin password.
- Use database version: PostgreSQL 14.
- Remember the region that you pick (you will use the same region for Cloud Run).
- Under _Customize your instance_ > _Connections_, make sure that _Public IP_ is enabled.

When you are happy with your choices, click _Create Instance_. Creating your database can take up to 20 minutes, so this is a good time for a quick coffee break.

### Create database user and database tables

When the Postgres instance creation has finished, you must add a database and an approved IP number you can connect from to access the database. Click on your database instance to open up its settings.

- Click _Databases_ > _Create Database_. For _Database name_, enter `serverpod`.
- Click _Connections_ > _Networking_. Then, click _Add Network_. Enter a name for where you will be connecting from, e.g., _Home_ or _Office_. For _Network_ enter your public IP number. If you are not sure, you can Google _what is my IP_ to find out.

Now you can connect to your database with your favorite Postgres tool. Postico is a good option if you are on a Mac. Click on the _Overview_ tab of the database and take note of the _Public IP address_. Use it, together with the user `postgres`, the database `serverpod`, and the password from your `passwords.yaml` file to connect to the database.

Run the database definition query from the latest migration directory `migrations/<LATEST_MIGRATION>/definition.sql`.

## Create a service account

For Cloud Run to access your database, you will need to create a service account with the _Cloud SQL Client_ role.

- Navigate to _IAM & Admin_ > _Service Accounts_.
- Click on _Create Service Account_.
- Choose a name for the account, e.g., _Cloud Run_.
- Add the _Basic_ > _Editor_ role and the _Cloud SQL_ > _Cloud SQL CLient_ role. Click _Continue_ and then _Done_.

Take note of the email of the newly created service account. You will need it when you deploy your server.

## Configure Serverpod

You will connect to Postgres from Cloud Run with the Cloud SQL Proxy. In your Postgres instance's _Overview_ page, copy the _Connection name_.

Open the `config/production.yaml` file. Under `database`, replace the host with the following string, but replace the connection name that you copied in the previous step: `/cloudsql/<CONNECTION_NAME>/.s.PGSQL.5432`. Also, add the `isUnixSocket` option and set it to `true`. Your configuration should look something like this:

```yaml
database:
  isUnixSocket: true
  host: /cloudsql/my-project:us-central1:database-name/.s.PGSQL.5432
  port: 5432
  name: serverpod
  user: postgres
```

## Deploy your server

Your server is now ready to be deployed. When you created your project, Serverpod also created a script for deploying your server. Copy it to the root of your server directory and make it executable. Make sure you are in your server directory (e.g., `myproject_server`). Then run the following command:

```bash
$ cp deploy/gcp/console_gcr/cloud-run-deploy.sh .
$ chmod u+x cloud-run-deploy.sh
```

Open up the script in your favorite editor. You will need to fill in your _database instance's connection name_ and the _email of your service account_.

Now, deploy your server by running the following:

```bash
$ ./cloud-run-deploy.sh
```

The script runs two deployment commands, one for your API and one for the Insights API used by the Serverpod app. While running, it may ask you to enable the Cloud Run and SQL Admin services. Answer yes to all these questions.

It will take a minute or two for the deployment to complete. Afterward, you can access your server through the URLs printed on the command line.

:::tip

You can deploy a new version of your server at any time by running `./cloud-run-deploy.sh` again.

:::

## Next steps

You may want to assign a custom domain name to your Cloud Run instances. You can manage domain name mappings in the Cloud Run Console. There you can also add a Redis instance (you can find it under _Integrations_). Redis allows you to cache data and communicate between servers.
