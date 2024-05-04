# Getting started

Welcome to the Twofold documentation! This guide will help you setup your first RSC application.

Before setting up your application it's recommended you read [Reasons you shouldn't use Twofold](/docs/guides/reasons-you-shouldnt-use-twofold).

## Prerequisites

You'll need to have [Node.js](https://nodejs.org) (>=20.9.0) and [PNPM](https://pnpm.io) (>=9.0.0) installed on your machine.

## Installation

Run the following command to create a new Twofold application:

```text
pnpm create twofold-app@latest
```

You'll be prompted to enter a name for your application.

Enter any name you'd like, for this guide we'll use the name: **my-app**.

```text
pnpm create twofold-app@latest

ℹ  info      Welcome to the Twofold app generator!

✔  What is the name of your app?  my-app

☐  pending   Setting up a new Twofold app...
☒  complete  App created!
☐  pending   Installing dependencies. This may take a minute...
☒  complete  Dependencies installed!
☐  pending   Initializing git repository...
☒  complete  Git repository created!

✔  success   All set!

ℹ  info      App installed at: ./my-app/
ℹ  info      Run app: cd my-app && pnpm dev
```

Once the installer has finished it will create a new directory with the name of your application.

Move into the new directory:

```text
cd my-app
```

And start the development server:

```text
pnpm dev
```

That's it! Visit [http://localhost:3000](http://localhost:3000) to see your new application up and running!
