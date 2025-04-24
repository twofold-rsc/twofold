# Docker

Docker allows you to build a Twofold app and run it in a container. This is useful for deploying your app to popular cloud provider likes AWS, Azure, and GCP.

## Prerequisites

{% callout %}
It's recommended you have experience with Docker before following this guide.
{% /callout %}

- A Twofold app
- Docker installed on your machine
- Knowledge of how to use Docker

## Step 1: Create a Dockerfile

Create a file called `Dockerfile` in the root of your app. This file will contain the instructions for building your Docker image.

```dockerfile
# Dockerfile

ARG NODE_VERSION=22.12.0

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
ENV NODE_ENV="production"
ENV NODE_OPTIONS="--conditions react-server"
ARG PNPM_VERSION=latest
RUN npm install -g pnpm@$PNPM_VERSION

FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3
COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "pnpm", "serve" ]
```

## Step 2: Create a .dockerignore file

Create a file called `.dockerignore` in the root of your app. This file will contain the files and directories that should be ignored when building the Docker image.

```text
# .dockerignore

/.twofold
/.git
/node_modules
.dockerignore
.env
Dockerfile
```

## Step 3: Build the Docker image

Run the following command in your terminal to build the Docker image:

```bash
docker build -t my-twofold-app .
```

## Step 4: Run the Docker container

Run the following command in your terminal to run the Docker container:

```bash
docker run --env-file ./.env -p 3000:3000 my-twofold-app
```

## Step 5: Access your app

Open your web browser and go to `http://localhost:3000` to see your Twofold app running in the Docker container.

## Step 6: Push the Docker image to a registry

You can push the Docker image to a registry like [Docker Hub](https://hub.docker.com/) or [AWS ECR](https://aws.amazon.com/ecr/). From there you can deploy your app to any major cloud provider.

Deploying docker images to a cloud provider is beyond the scope of this guide, but you can find documentation for each provider on how to do this.
