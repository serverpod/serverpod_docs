# Deploying to Google Cloud Run
Serverpod makes it easy to deploy your server to Google Cloud Run using Github and Github Actions.


Creating your project using serverpod create Serverpod will automatically generate your Github workflow for cloud run. The default setup uses a minimal configuration that will fit within the free tier, but you can easily modify the configuration to suit your needs.

:::caution

Using Serverpod’s workflow may incur costs if you made any changes or if the cloud provider changed the free qoutes. Serverpod’s scripts are provided as-is, and we take no responsibility for any unexpected charges for using them.



:::

## Prerequisites
To deploy serverpod to Cloud Run, you will need the following:

1. An Google Cloud Account.

2. Ensure the required Google Cloud APIs are enabled
   
   | API                  |                      |
   | --- | --- |
   | Cloud Run         |   run.googleapis.com |
   | Artifact Registry |   artifactregistry.googleapis.com |

3. Service account with appropriate access .

:::info
Steps to create service account are below
:::

|   	|   	|
|---	|---	|
| roles/run.admin   	| To create cloud run service   	|
| roles/iam.serviceAccountUser  	| To act as the Cloud Run runtime service account  	|
| roles/artifactregistry.admin  | scope:-   project or repository level |


4. Your Serverpod project version controlled on Github.


:::info

The top directory created by Serverpod must be the root directory of your Git repository. Otherwise, the deployment scripts won’t work correctly.

:::

## What will be deployed?
Once you made push to cloudrun-deploy branch the cloud run workflow will get triggred

The docker cli which comes with the Github actions is authenticated with the google cloud  credentials

The workflow will create a docker image and push that to the [Artifact Registry](https://cloud.google.com/artifact-registry)

[Artifact Registry Pricing](https://cloud.google.com/artifact-registry/pricing)

Then a [Cloud Run](https://cloud.google.com/run) service is created with the newly created docker image using official [Google Github-Action](https://github.com/google-github-actions/deploy-cloudrun)

[Cloud Run Pricing](https://cloud.google.com/run/pricing)


:::info

Cloud Run Deploy Doesn't Setup and other resources like Postgres Database,Cloud Storage or Redis Memory etc...
you need to pass the database url in the config files

:::

## Let's deploy!!!

1. Make Sure your datebase is up and running and the config files points to the respective end points.

2. Login to cloud console create a project and Enable the Required API

    |  |      |
    | --- |  ----       |
    |  1  |  Cloud Run Admin API  |
    |  2  |  Artifact Registry API  |

` Menu >APIs and Services > Enabled APIs and Services  `

![Path](/img/docs/05-deployments/gcp/3-enable-api-services.png)

Click Enable API

![Enable](/img/docs/05-deployments/gcp/4.enable-api-services.png)

Search for the API

![API Search](/img/docs/05-deployments/gcp/5.search-api.png)


Click Enable

![Click Enable](https://i.stack.imgur.com/HJ3fE.png)

Do the Same for `Artifact Registry API`



3. Create Service Account in GCP Console 

    `Menu > IAM and admin > Service accounts`

![Service account](/img/docs/05-deployments/gcp/6.service-account.png)

Click create service account

![create service account](/img/docs/05-deployments/gcp/7.create-service-account.png)

Enter the service account name and click create and continue

![service account name](/img/docs/05-deployments/gcp/8.account-details.png)

All the following roles

![roles](/img/docs/05-deployments/gcp/9.roles.png)

And Click Done

Now it will take you to service account page with our new service account.Now Click the action button of the service account and select manage keys

![manage](/img/docs/05-deployments/gcp/10.manage-keys.png)

Click add key and 

![addkey](/img/docs/05-deployments/gcp/11.add-key.png) 

select json and click create it will download the json file

![json](/img/docs/05-deployments/gcp/12.json.png)


4. Create Github Secrets.

    ` Github Repository > Settings > Secrets > Actions > New Repository Secre`

Add the following secrets

|  |  |
|-- | -- |
| Name | Secret |
| SERVERPOD_PASSWORDS | your config/passwords.yaml (copy the content from the file and past the value in the text field) |
| GOOGLE_CREDENTIALS  | Copy your service account key json which we create in the before step (copy the content from the file and past the value in the text field)
  


![Create Secret](/img/docs/05-deployments/gcp/2-github-secrets.png)


Set the required variables in deployment-cloudrun.yml

![example](/img/docs/05-deployments/gcp/13.gcp_env.png)

for more location Please refere gcp console

Now Make Git push and have a cup of coffee github 
workflow will deploy your service you can get your 
service url in gcp cloud run console or in github
actions 

![output url](/img/docs/05-deployments/gcp/14.out_put.png)

use this url to connect with the server from client 

```

var client = Client('https://serverpod-cloudrun-deployment-cloudrun-staging-st-efhbvna5aa-el.a.run.app/')
  ..connectivityMonitor = FlutterConnectivityMonitor();

```

:::info

Tips and tricks

:::

Placing the Artifact Registry and cloud run service in the same region helps to reduce the network transfer

When you make a new git commit a new revision is created in the existing cloud run service and traffic is migrated to the new service

You can change the deployment configuration.If you need please 
feel free to take a look at [Cloud Run Actions](https://github.com/google-github-actions/deploy-cloudrun)

If you forgot to add the correct database urls and passwords
you can deleted the service and redeploy

