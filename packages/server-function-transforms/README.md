# Server Function Transforms

A package for transforming, hoisting, and encrypting RSC Server Functions.

## Why it's useful

Imagine a server function that closes over a prop passed into a component:

```tsx
export default function Page({ name }) {
  return <FormComponent name="bob" />;
}

function FormComponent({ name }) {
  async function greet() {
    "use server";
    console.log("hello", name);
  }

  return (
    <form action={greet}>
      <button type="submit">Greetings!</button>
    </form>
  );
}
```

In the above example, the `greet()` function closes over the `name` prop, which means that `name` will be given to the browser and sent back to the server when the form is submitted.

To ensure that `name` is tamper-proof, it needs to be encrypted and later verified when `greet` is run.

Without verification, a malicious client could change the `name` prop to something else before submitting the form.

![An encrypted server function](https://media.graphassets.com/mcFVofoiQwyUkab7edPl)

In the encrypted version the `name` prop cannot be changed without knowing the server-side encryption key. This ensures that the data passed between the server and browser is tamper-proof.

## Features

- Turns `"use server"` functions into server references.
- Turns exports from `"use server"` modules into server references.
- Allows `"use server"` modules to be imported into client bundles.
- Encrypts and verifies closure variables used in server functions.
- Supports factory functions.

## Who's this for?

This package is for developers creating their own RSC bundler or framework, who are looking to add support for server functions and actions.

If you are using an existing RSC framework then you do not need this package.

## Usage

Installation:

```text
npm install @twofold/server-function-transforms
```

Usage:

```typescript
import { transform, envKey } from "@twofold/server-function-transforms";

const code = `
  export default function Page({ name }) {
    async function greet() {
      "use server";
      console.log("hello", name);
    }

    return (
      <form action={greet}>
        <button type="submit">Greetings!</button>
      </form>
    );
  }
`;

const result = await transform({
  input: {
    code,
    language: "jsx",
  },
  moduleId: "unique-identifier-for-this-module",
  encryption: {
    key: envKey("ENCRYPTION_KEY"),
  },
});

console.log("transformed code", result.code);
// => "export default function Page({ name }) { ... }"

console.log("server functions", result.serverFunctions);
// => ["tf$serverFunction$0$greet"]
```

## API

### Server transforms

Code is transformed using the `transform` function.

```typescript
import { transform } from "@twofold/server-function-transforms";

const { code, serverFunctions } = await transform({
  input: {
    code,
    language,
  },
  moduleId,
  encryption: {
    key,
    source
  };
});
```

This function takes an object with the following properties:

| Property            | Type                    | Description                                                              |
| ------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `input.code`        | `string`                | The source code to transform                                             |
| `input.language`    | `string`                | The language of the source code. Can be `jsx`, `tsx`, `js`, or `ts`      |
| `moduleId`          | `string`                | A unique identifier for the module. Used when creating server references |
| `encryption.key`    | `envKey` \| `stringKey` | The encryption key to use when encrypting closure variables              |
| `encryption.source` | `string`                | Optional: Bring your own encryption/serialization functions              |

The transform function returns an object with the following:

| Property          | Type       | Description                                                                             |
| ----------------- | ---------- | --------------------------------------------------------------------------------------- |
| `code`            | `string`   | The transformed source code                                                             |
| `serverFunctions` | `string[]` | An array of server function names that were transformed and exported in the source code |

### Encryption

The `encryption` option is used to encrypt and decrypt closure variables used in server functions. This is done to ensure that the data passed between server and client is tamper-proof.

Under the hood, this package uses AES-GCM as the encryption algorithm.

#### Keys

The `key` property tells the server function where to find the encryption key.

Using `envKey` will instruct the server function to load the encryption key from an environment variable.

```typescript
import { envKey } from "@twofold/server-function-transforms";

const { code, serverFunctions } = await transform({
  // ...
  encryption: {
    key: envKey("ENCRYPTION_KEY"),
  };
});
```

In the above example, the transformed code will use `process.env.ENCRYPTION_KEY` as the encryption key.

Alternatively, you can use `stringKey` for a hardcoded string encryption key. This should only be used for testing purposes though, since it will inject the key directly into the transformed source code.

#### Source

This package ships with built-in encryption and serialization functions. If you would like to bring your own encryption you can pass in a module using the `source` property.

The module should export two async functions: `encrypt` and `decrypt`.

```typescript
import { envKey } from "@twofold/server-function-transforms";

const { code, serverFunctions } = await transform({
  // ...
  encryption: {
    key: envKey("ENCRYPTION_KEY"),
    source: "my/own/encryption/module"
  };
});
```

If you choose to bring your own encryption, the two functions should have the following signatures:

```typescript
function encrypt(data: any, key: string): Promise<string>;
function decrypt(data: string, key: string): Promise<any>;
```

### Module transforms

When given a module with a top-level `"use server"` directive the transform function will turn all function exports into server references. When a module is marked with `"use server"` all exports are considered server functions, so they do not need to individually be marked with `"use server"`.

```typescript
let code = `
  "use server";

  let count = 0;

  export function increment() {
    count = count + 1;
  }

  export function decrement() {
    count = count - 1;
  }
`;

const result = await transform({
  input: {
    code,
    language: "js",
  },
  moduleId: "a-counter-module",
});

console.log("server functions", result.serverFunctions);
// => ["increment", "decrement"]
```

### Client bundle transforms

To transform server modules into code that is importable by client bundles, pass the `client` option to the transform function.

```typescript
import { transform } from "@twofold/server-function-transforms";

const { code, serverFunctions } = await transform({
  input: {
    code,
    language,
  },
  moduleId,
  client: {
    callServerModule: "path/to/my/call-server",
  },
});
```

You must specify the path to a module that exports your framework's `callServer` function as `client.callServerModule`.

For example:

```typescript
// path/to/my/call-server.js

export async function callServer(id: string, args: any[]) {
  console.log("client bundle calling server function", id, args);
}
```

Note that encryption is not available when using `transform` with the `client` option, since the output is made to be imported by client bundles.

## Unsupported features

There are most likely some functions that do not get transformed properly by this package. I'd love to hear about any bugs you run into or suggestions you have. Feel free to reach out to me on [Twitter/X](https://twitter.com/ryantotweets) or [Bluesky](https://bsky.app/profile/ryantoron.to).

## Roadmap

- Action & function signing
- Runner

## Acknowledgements

I would like to thank [Next.js](https://nextjs.org/) and [Tangle](https://github.com/lubieowoce/tangle) for their excellent work on React Server Components. Encrypted server functions were first introduced by Next.js and their source code and tests were an invaluable resource for better understanding server functions.
