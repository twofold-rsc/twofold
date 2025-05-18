# Getting started

Welcome to the Twofold documentation! This guide will help you setup your first application.

## What's Twofold?

Twofold is a framework for building RSC applications. Every Twofold app comes with:

- An **RSC Router** built on top of React's Suspense and Transition APIs.
- Bundling and splitting support for **Server Components** and **Client Components**.
- Secure **Server Functions** that automatically handle encryption and decryption of sensitive data.
- Automatic configuration and setup for React Compiler, Tailwind, TypeScript, Prettier, HMR, and linting rules.

Before continuing it's recommended you read [Don't use Twofold](/docs/philosophy/dont-use-twofold).

## Prerequisites

You'll need to have [Node.js](https://nodejs.org) (>=22.12.0) installed on your machine.

## Installation

Run the following command to create a new Twofold application:

{% cli-command selectable=true %}
{% cli-tool name="pnpm" %}
pnpm create twofold-app@latest
{% /cli-tool %}
{% cli-tool name="npm" %}
npx create-twofold-app@latest
{% /cli-tool %}
{% /cli-command %}

You'll be prompted to enter a name for your application.

For this guide we'll use the name: **my-app**.

{% create-twofold-app /%}

Once the installer finishes it will create a new directory with the name of your application.

Move into the new directory:

```text
cd my-app
```

And start the development server:

{% cli-command %}
{% cli-tool name="pnpm" %}
pnpm dev
{% /cli-tool %}
{% cli-tool name="npm" %}
npm run dev
{% /cli-tool %}
{% /cli-command %}

That's it! Visit [http://localhost:3000](http://localhost:3000) to see your new application up and running!
