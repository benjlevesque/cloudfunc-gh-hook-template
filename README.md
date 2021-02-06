# Github Webhook on Google Cloud function

This template shows the configuration to deploy a github webhook on a Google Cloud function. It relies on [cloudfunc-gh-hook](https://github.com/benjlevesque/cloudfunc-gh-hook) to handle the webhook.


## Setup

- Create a repo using this [template](https://github.com/benjlevesque/gcloud-gh-hook-template/generate).

- Clone your newly created repository

- Run this command. 
```bash
cp .env.example .env && cp env_vars.yaml.example env_vars.yaml
```
These files should not be added to version control as they will contain sensitive information

- Go to [smee.io](https://smee.io/new) to create a proxy for your webhook. Store the URL in `.env` instead of `YOUR_SMEE_URL`.

- Add a webhook to your repo<sup>1</sup>  (https://github.com/{owner}/{repo}/settings/hooks/new)
  - Payload URL should be your Smee URL
  - Content type must be `application/json` 
  - Secret should be a generated secret. You must store this secret in your `.env`, instead of `YOUR_WEBHOOK_SECRET`.
  - Under `Which events would you like to trigger this webhook?`, you may pick any option you want, but it is recommended to select just the individual events you need.
 
<sup>1</sup> Note that you probably don't want to setup the webhook on your newly created repository. You probably have a repo A for your application's code, and a repo B containing your webhook's code (the one you created with the template). However, it may be useful to first setup your hook on repo B for testing purposes. 

## Development

- in a first terminal, start the Smee proxy. This will route all trafic sent to the previously created URL to your local machine
```bash
yarn start:proxy
```

- in a second terminal, watch for code changes
```bash
yarn watch
```

- in a third terminal, start the functions local dev environment. This is using google's [functions-framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)
```bash
yarn dev
```

You now have a running github webhook. Try sending events to your repository, they should now trigger events on your local machine.

## Deployment

Pre-requisites:
- Access to a GCP project, with [Clouds functions API](https://console.cloud.google.com/apis/api/cloudfunctions.googleapis.com/) & [Cloud Build API](https://console.cloud.google.com/apis/api/cloudbuild.googleapis.com/) enabled (`gcloud services enable cloudfunctions.googleapis.com && gcloud services enable cloudbuild.googleapis.com`)
- [gcloud cli](https://cloud.google.com/sdk/gcloud) installed and configured

_You might want to change the name of the function before deploying it. Replace `gcloud-gh-hook-template` by whatever you want in `package.json scipts > deploy`_

First, you will need to set your production environment variables in `env_vars.yaml`. The secret might be different from your development one. 

Run `yarn deploy` to build & deploy your code to a new cloud function. The same command can be used to update the function.

## Deployment automation

You can use the provided [github workflow](./.github/workflows/function.yaml) to automate the update of your cloud function on each push to `main`. 

For it to work, you must configure a service account:
```bash
SA_NAME=gh-function
PROJECT_ID=YOUR_PROJECT_ID

# create service account
gcloud iam service-accounts create $SA_NAME

# grant permissions to the service account to the default SA, that runs the function.
# if your function runs with a different SA, change $PROJECT_ID@appspot.gserviceaccount.com to the right value.
gcloud iam service-accounts add-iam-policy-binding $PROJECT_ID@appspot.gserviceaccount.com --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" --role=roles/iam.serviceAccountUser

# grant permissions to the service account to the cloud function itself
gcloud functions add-iam-policy-binding gcloud-gh-hook-template --member "serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" --role=roles/cloudfunctions.developer


# create a key for the service account
gcloud iam service-accounts keys create ./key.json --iam-account $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com
```

On your Github project, add secrets (https://github.com/{owner}/{repo}/settings/secrets/new):
- GCP_PROJECT_ID: your google project ID
- GCP_SA_KEY: the content of the generated `key.json` file.