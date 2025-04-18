# Getting started

Welcome to the Twofold documentation! This guide will help you setup your first request-response based RSC application.

## What's Twofold?

Twofold is a framework for building RSC applications. Every Twofold app comes with:

- An **RSC Router** built on top of React's new Suspense and Transition APIs.
- Full support for **Server Components** and **Client Components**.
- Secure **Server Functions** that automatically handle encryption and decryption of sensitive data.
- Automatic configuration and setup for React Compiler, Tailwind, TypeScript, Prettier, React refresh, and React linting.

Before continuing it's recommended you read [Don't use Twofold](/docs/philosophy/dont-use-twofold).

## Prerequisites

You'll need to have [Node.js](https://nodejs.org) (>=22.12.0) and [PNPM](https://pnpm.io) (>=9.0.0) installed on your machine.

## Installation

Run the following command to create a new Twofold application:

```text
pnpm create twofold-app@latest
```

You'll be prompted to enter a name for your application.

For this guide we'll use the name: **my-app**.

{% create-twofold-app /%}

Once the installer finishes it will create a new directory with the name of your application.

Move into the new directory:

```text
cd my-app
```

And start the development server:

```text
pnpm dev
```

That's it! Visit [http://localhost:3000](http://localhost:3000) to see your new application up and running!
