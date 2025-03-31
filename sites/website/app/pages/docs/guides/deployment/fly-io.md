# Fly.io

This guide will show you how to deploy a Twofold app to [Fly.io](https://fly.io).

## Prerequisites

- A Twofold app
- A GitHub repository for your app
- A Fly.io account

## Step 1: Launch an app on Fly.io

Login to your Fly.io account and visit the [Fly.io dashboard](https://fly.io/dashboard). Click the "Launch App" button.

When asked, select "Launch from GitHub" and choose your repository.

{% image src="/images/guides/deploy/fly-io/launch-from-github.png" alt="Select your GitHub repository" border=true /%}

Finally, select the GitHub repository that contains your Twofold app.

{% callout %}
Before seeing your repository, you may be asked to grant Fly.io access to your GitHub repositories. Follow the prompts to do so.
{% /callout %}

## Step 2: Customize your deploy

Once your GitHub repository is selected, click the button that say "Customize deploy".

{% image src="/images/guides/deploy/fly-io/customize-deploy.png" alt="Customize deploy" border=true /%}

#### Region

Select the region that's closest to you.

#### Internal port

Enter `3000` as the internal port.

{% image src="/images/guides/deploy/fly-io/internal-port.png" alt="Internal port" border=true /%}

#### Machine sizes

Select the machine size you want to use. Any of the available options should be sufficient for running a Twofold app. If you are unsure what to select and are just testing, then the shared CPU with 512mb of RAM is a good option.

{% image src="/images/guides/deploy/fly-io/machine-sizes.png" alt="Machine sizes" border=true /%}

#### Secrets

You'll need to add a `TWOFOLD_SECRET_KEY` secret to deploy your app. This can be any random string. If you are unsure what to use here, you can copy the existing one from your local `.env` file.

{% image src="/images/guides/deploy/fly-io/secrets.png" alt="Secrets" border=true /%}

## Step 3: Deploy your app

We're now done customizing the deploy. Click the "Confirm settings" button to start your first deployment.

After about a minute, your app should be deployed and you should see a success message.

{% image src="/images/guides/deploy/fly-io/deploy-success.png" alt="Deploy success" /%}

You can click the "Visit your app" button to see your Twofold app running on Fly.io!

## Step 4: Create the Fly Pull Request

Fly will create a pull request in your GitHub repository with the necessary configuration files to deploy your app again in the future.

Click the purple "Create Pull Request" button.

And then click the "See Pull Request" button.

This will take you to the pull request in your GitHub repository.

{% image src="/images/guides/deploy/fly-io/create-pull-request.png" alt="Create PR" border=true /%}

You can merge this pull request into your main branch.

## Step 5: Enable auto deploy

Setup Fly.io to automatically deploy your app whenever you push to GitHub.

Go back to the [Fly.io dashboard](https://fly.io/dashboard) and select your app.
Then navigate to `Deployments -> Settings` and enable the `Auto Deploy` option.

{% image src="/images/guides/deploy/fly-io/auto-deploy.png" alt="Auto deploy" border=true /%}

Now Fly.io will automatically deploy your app whenever you push to the main branch.

## Step 6: Turn off automatic suspension

By default, Fly.io apps automatically suspend after a time period of inactivity. There are some pros and cons to suspending your app.

- Pro: You don't have to pay for an app that isn't being used. This is great for demo applications.
- Con: Your app will take a few seconds to start up when it is accessed after being suspended. This is not ideal for production applications.

In order to keep your Twofold app fast and responsive, we'll disable the automatic suspension.

{% callout %}
You can skip the rest of this step if you are just testing your app and don't mind the cold-starts that happen when an app is suspended.
{% /callout %}

#### Pull main down to your computer

Pull the changes from the Fly pull request down to your local machine.

```text
git pull origin main
```

Open the `fly.toml` file, this file contains the configuration for your Fly.io app.

Change the `auto_stop_machines` setting to `false`. And set the `min_machines_running` setting to `1`.

```toml
# fly.toml

app = 'fly-deploy-demo'
primary_region = 'iad'

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop' // [!code --]
  auto_stop_machines = false // [!code ++]
  auto_start_machines = true
  min_machines_running = 0 // [!code --]
  min_machines_running = 1 // [!code ++]
  processes = ['app']

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 512
```

These settings will ensure that your app is always running and ready to serve requests.

Commit these changes to your local repository and push them to GitHub.

## Step 7: All done

That's it! Your Twofold app is now deployed to Fly.io and will automatically deploy whenever you push to GitHub. 🎉
