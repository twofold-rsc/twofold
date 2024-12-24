# Cookies

Twofold has built in support for reading, setting, and destroying cookies.

## Reading cookies

Cookies can be read in Twofold using the cookies module:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export default function IndexPage() {
  const cookie = cookies.get("my-cookie");

  return <p>The value of `my-cookie` is {cookie}</p>;
}
```

Cookies are readable in pages, layouts, server components, server functions, and middleware.

## Setting cookies

To set cookies:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function setCookie() {
  "use server";

  cookies.set("my-cookie", "cookie-value-here");
}

export default function Page() {
  return (
    <form action={setCookie}>
      <button type="submit">Set cookie</button>
    </form>
  );
}
```

Note that cookies should only be set in server actions or middleware. Setting cookies in pages, layouts, or server components is forbidden.

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export async function before() {
  // ✅ Set cookies in middleware
  cookies.set("my-cookie", "cookie-value-here");
}

export default function Page() {
  // ❌ Do not set cookies during render
  cookies.set("my-cookie", "will-not-work");

  // ...
}
```

Cookies can be set with additional options:

```tsx
cookies.set("my-cookie", "cookie-value-here", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
});
```

For a full list of options, see the [cookie documentation](https://github.com/jshttp/cookie?tab=readme-ov-file#options-1).

## Destroying cookies

To destroy cookies:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function destroyCookie() {
  "use server";

  cookies.destroy("my-cookie");
}

export default function Page() {
  return (
    <form action={destroyCookie}>
      <button type="submit">Destroy cookie</button>
    </form>
  );
}
```

Cookies should only be destroyed in server actions or middleware.

## Encrypted cookies

Encrypted cookies allow you to set cookies that are tamper-proof and unreadable by clients. These cookies are useful for storing sensitive information like user IDs or session information.

### Setting encrypted cookies

Use `cookies.encrypted` to set an encrypted cookie:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function setCookie() {
  "use server";

  await cookies.encrypted.set("my-encrypted-cookie", "my-value");
}

export default function Page() {
  return (
    <form action={setCookie}>
      <button type="submit">Set cookie</button>
    </form>
  );
}
```

The `set` method is asynchronous and should be awaited.

Just like regular cookies, encrypted cookies should only be set in server actions or middleware.

### Reading encrypted cookies

To read an encrypted cookie:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export default async function Page() {
  let value = await cookies.encrypted.get("my-encrypted-cookie");

  return <p>The value of `my-encrypted-cookie` is {value}</p>;
}
```

The `get` method is asynchronous and should be awaited.

### Encrypted values

In addition to strings, encrypted cookies can store any serializable value, including objects and arrays.

```tsx
import cookies from "@twofold/framework/cookies";

await cookies.encrypted.set("list", [1, 2, 3]);
await cookies.encrypted.set("user", { id: 1, name: "Alice" });

// and in a later request...

let list = await cookies.encrypted.get("list");
console.log(list); // => [1, 2, 3]

let user = await cookies.encrypted.get("user");
console.log(user); // => { id: 1, name: "Alice" }
```

This is useful for storing complex data structures like user objects or database results.

### Browser storage

Encrypted cookies are stored in the browser, but they are unreadable by humans.

For example the following cookie:

```tsx
import cookies from "@twofold/framework/cookies";

await cookies.encrypted.set("name", "value");
```

Will be stored as:

```text
Cookie name: tfec_name
Cookie value: JNwvQWbZRywFfXiW:6WmwprMrl8J41j6LwRIcTsagSKp81U5MF50lV8QrHtAEA+SunFO7rClE2lbrxBeEzlg=
```

A cookie that has been tampered with will be rejected by the server.

### Destroying encrypted cookies

Similar to regular cookies, encrypted cookies can be destroyed using the `cookies.encrypted.destroy` method:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function destroyCookie() {
  "use server";

  cookies.encrypted.destroy("my-encrypted-cookie");
}
```
