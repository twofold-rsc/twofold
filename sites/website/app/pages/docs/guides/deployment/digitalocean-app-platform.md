# DigitalOcean App Platform

This guide will show you how to deploy a Twofold app to [DigitalOcean's App Platform](https://www.digitalocean.com/products/app-platform).

The App Platform is a fully managed service that allows you to deploy and auto scale your application. DigitalOcean takes care of all the infrastructure, including putting your app behind a global CDN and managing SSL certificates.

## Prerequisites

- A Twofold app
- A GitHub repository for your app
- A DigitalOcean account

## Step 1: Create a DigitalOcean app

Login to your DigitalOcean account and visit the [App Platform](https://cloud.digitalocean.com/apps) dashboard.

You'll need to create a new DigitalOcean app. Start by selecting "GitHub" as your source, then click "Create app".

{% image src="/images/guides/deploy/digitalocean-app-platform/create-app.png" alt="Create a new app" border=true /%}

Next, you should see a list of your GitHub repositories. Select the repository that contains your Twofold app.

{% image src="/images/guides/deploy/digitalocean-app-platform/select-repo.png" alt="Select your GitHub repository" /%}

{% callout %}
Before seeing your repository, you may be asked to grant DigitalOcean access to your GitHub repositories. Follow the prompts to do so.
{% /callout %}

Select your main branch and click "Next".

## Step 2: Configure resources

We're now ready to configure your app's resources.

#### Size

{% image src="/images/guides/deploy/digitalocean-app-platform/size.png" alt="Configure your app's size" border=true /%}

You can configure your applications instance size and containers under the "Size" panel. Any option listed here should be sufficient for running a Twofold app. If you are unsure what to select and are just testing, the cheapest option is a good place to start.

#### Deployment settings

{% image src="/images/guides/deploy/digitalocean-app-platform/deployment-settings.png" alt="Configure your app's deployment settings" border=true /%}

In the "Deployment settings" panel, you need to specify the build and run commands.

- Build command: `pnpm run build`
- Run command: `pnpm run serve`

#### Network

{% image src="/images/guides/deploy/digitalocean-app-platform/network.png" alt="Configure your app's network settings" border=true /%}

Under the "Network" panel, you must change the "Public HTTP Port" to `3000`. All other settings can remain unchanged.

#### Environment variables

{% image src="/images/guides/deploy/digitalocean-app-platform/environment-variables.png" alt="Configure your app's environment variables" border=true /%}

There are two required variables you need in order to deploy your Twofold app: `NODE_ENV` and `TWOFOLD_SECRET_KEY`.

- Set the `NODE_ENV` environment variable to `production`.
- Set the `TWOFOLD_SECRET_KEY` environment variable to any random string. If you are unsure what to use here, you can copy the existing one from your local `.env` file.

Use DigitalOcean's "Add from .env" feature to quickly copy and paste the environment variables from your local `.env` file. This will ensure your app has all of the necessary environment variables, like your database connection string and API keys.

Most environment variables should have the scope "Run and build time". You can encrypt any sensitive environment variables.

#### Region

Select the region that's closest to you.

We're done configuring and we're now ready to deploy! Click the "Create app" button to begin the deploy.

{% image src="/images/guides/deploy/digitalocean-app-platform/create-app-deploy.png" alt="Deploy your app" /%}

## Step 3: Deploy

Once you click the "Create app" button DigitalOcean will begin deploying your application. You'll be brought to a screen with a button that says "Go to Build Logs". Click this button to see the progress of your deployment.

{% image src="/images/guides/deploy/digitalocean-app-platform/go-to-build-logs.png" alt="Go to Build Logs" /%}

The Build logs will show you the progress of your deployment. Once the deployment is complete, you can click the "Live App" button to view your app.

{% image src="/images/guides/deploy/digitalocean-app-platform/build-logs.png" alt="Build logs" /%}

DigitalOcean may take a few minutes to finish deploying your app the first time. If deployment is successful, you'll see a message that says "Deployed successfully!".

At the top of the page, you'll see a link to view your live app.

{% image src="/images/guides/deploy/digitalocean-app-platform/live-app.png" alt="Live app" /%}

## Step 4: All done

That's it! Your Twofold app is now deployed to DigitalOcean and will automatically redeploy whenever you push to GitHub. 🎉
