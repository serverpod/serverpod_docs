# Deploying to Google Cloud Run
Serverpod makes it easy to deploy your server to Google Cloud Run using Github and Github Actions.


Creating your project using serverpod create Serverpod will automatically generate your Github workflow for cloud run. The default setup uses a minimal configuration that will fit within the free tier, but you can easily modify the configuration to suit your needs.

:::caution

Using Serverpod’s workflow may incur costs if you made any changes or if the cloud provider changed the free qoutes. Serverpod’s scripts are provided as-is, and we take no responsibility for any unexpected charges for using them.



:::

## Prerequisites
To deploy serverpod to Cloud Run, you will need the following:

1. An Google Cloud Account.
2. Service account with appropriate access for the services which we will be using 
3. Your Serverpod project version controlled on Github.


:::info

The top directory created by Serverpod must be the root directory of your Git repository. Otherwise, the deployment scripts won’t work correctly.

:::

## What will be deployed?
Once you made push to the github the cloud run workflow will get triggred

The docker cli which comes with the Github actions is authenticated with the google cloud  credentials

The workflow will create a docker image and push that to the [Artifact Registry](https://cloud.google.com/artifact-registry)

[Artifact Registry Pricing](https://cloud.google.com/artifact-registry/pricing)

Then a [Cloud Run](https://cloud.google.com/run) service is created with the newly created docker image using official [Github-Action](https://github.com/google-github-actions/deploy-cloudrun)

[Cloud Run Pricing](https://cloud.google.com/run/pricing)


:::info

Cloud Run Deploy Doesn't Setup and other resources like Postgres Database,Cloud Storage or Redis Memory etc...

:::

## Let's deploy!!!

1. Make Sure your datebase is up and running and the config files points to the respective end points.

2. Login to cloud console and Enable Required API

    |  |      |
    | --- |  ----       |
    |  1  |  Cloud Run Admin API  |
    |  2  |   Artifact Registry API  |
    |  3  |  Cloud Storage  |

 The deploying service account must have the Cloud Build Service Account role. The initial deployment will create an Artifact Registry repository which requires the Artifact Registry Admin role.

3. Create Service Account in GCP Console 




4. Create Github Secrets.

    `Project > Settings > Secrets > Actions > New Repository Secret`
    
    ![Create Secret](/img/3.1-github-secrets.png)

    * Create a new Secret 
    name:- SERVERPOD_PASSWORDS 
    secret: - your config/passwords.yaml (copy the content from the file and past the value in the text field)

    ![Create Secret](/img/3.2-github-secrets.png)

   
    name:- GOOGLE_CREDENTIALS
    secret: - Copy your service_account.json (copy the content from the file and past the value in the text field)