# Choosing deployment strategy

There are different options for hosting Serverpod. The minimal requirements are a single server or a serverless managed platform like Google Cloud Run and a Postgres database. Which setup you choose depends on the requirements of your architecture.

The main two options are running Serverpod on a cluster of servers or on a serverless platform. You must run your servers on a cluster of servers (such as Google Cloud Engine) if your servers have a state. If they are stateless, you can run on a serverless platform (such as Google Cloud Run). An example of a stateful server is [Pixorama](https://pixorama.live), where the server keeps the state up to date in real time in the server's memory. If you only make API calls to retrieve data from a database, running on a serverless platform may be your best option.

Here are some pros and cons for the different options:

|      | Server cluster | Serverless |
| :--- | :--------| :--------- |
| Pros | All features are supported.  Great for real time communication.  Cost efficient at scale. | Minimal starting cost.  Easier configuration.  Minimal maintenance. |
| Cons | Slightly higher starting cost.  More complex to set up. | Limited feature set.  The server cannot have a state. |

The features that currently are not supported by the serverless option are:

- Future calls. (Configuration is possible but requires a more advanced setup.)
- Health metrics.
- On-server caching. Caching on the server can still occur when serverless instances are kept alive but can be lost at any time. Caching with Redis is supported.
- State. You cannot store any global information in the server's memory. Instead, you must rely on external services such as Postgres, Redis, or other APIs.

## Supported platforms

We provide Terraform scripts for setting up your infrastructure with Google Cloud Platform or Amazon Web Services. Still, you can run Serverpod anywhere you can run Dart or host a Docker container.

### Server cluster

Serverpod's Terraform scripts will set up an auto-scaling group of servers and configure a database, load balancer, domain names, and certificates. Optionally, you can deploy a staging environment and additional services such as Redis and buckets for file uploads. You deploy new revisions through Github actions, where you can also set up continuous testing.

These are approximate starting pricing for the primary required services of a minimal setup on Google Cloud Platform. The minimal setup can handle a fair amount of users at no additional cost. With more traffic, the price will be higher but typically scale well. In addition, with a server cluster you can cache data and state directly on your servers which can cut down costs as you scale.

| Service                  | Min cost |
| :----------------------- | :------- |
| Compute Engine Instance  |  $7 / mo |
| Cloud Load Balancing     | $19 / mo |
| Cloud SQL for PostgreSQL | $10 / mo |

### Serverless

Serverpod runs well on serverless platforms such as Google Cloud run. We do not yet provide terraform scripts for Cloud Run, but it is easy to set up using the GCP console. You can upload new revisions from your command line.

With Cloud Run, you only pay for handling the traffic you receive. There is no starting cost, and no extra load balancer is required.

| Service                  | Min cost |
| :----------------------- | :------- |
| Cloud Run                |  $0 / mo |
| Cloud SQL for PostgreSQL | $10 / mo |

:::warning

The prices shown on this page are approximations and are meant to give you a rough idea of hosting costs. Additional costs may occur, and prices may change. Make sure to do your own research before deploying your infrastructure.

:::
