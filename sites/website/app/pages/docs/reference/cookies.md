# Cookies

Twofold has built in support for reading, setting, and destroying cookies.

## Reading cookies

Cookies can be read in Twofold using the cookies module:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export default function IndexPage() {
  // Read the value of a cookie
  const cookie = cookies.get("my-cookie");

  return <p>The value of `my-cookie` is {cookie}</p>;
}
```

Cookies are readable in pages, layouts, server components, server functions, and middleware.

If the cookie doesn't exist, `get()` will return undefined.

## Setting cookies

To set cookies in Twofold, use the `set()` function:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function setCookie() {
  "use server";

  // Setting a cookie with a value
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

Cookies should only be set in server actions or middleware. Setting cookies in pages, layouts, or server components is forbidden.

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export function before() {
  // ✅ Allowed: Set cookies in middleware
  cookies.set("my-cookie", "cookie-value-here");
}

export default function Page() {
  // ❌ Forbidden: Setting cookies during render
  cookies.set("my-cookie", "will-not-work");

  // ...
}
```

### Cookie options

Use the third argument of `set()` to provide additional options:

```tsx
cookies.set("my-cookie", "cookie-value-here", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
});
```

For a detailed list of options and their behavior, check the [cookie package documentation](https://github.com/jshttp/cookie?tab=readme-ov-file#options-1).

## Destroying cookies

To remove cookies in Twofold, use the `destroy()` function.

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function destroyCookie() {
  "use server";

  // Destroying the cookie
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

Like setting cookies, destroying them should only be done in server actions or middleware.

## Encrypted cookies

Encrypted cookies allow you to store data that is both tamper-proof and unreadable by clients. These cookies are ideal for securely storing sensitive information such as user IDs, session information, or other private data.

All standard cookie functions are available within `cookies.encrypted`.

### Setting encrypted cookies

To set an encrypted cookie, use the asynchronous `cookies.encrypted.set()` function:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function setCookie() {
  "use server";

  // Set an encrypted cookie
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

The `set` function is asynchronous and must be awaited to ensure the cookie is properly set.

Encrypted cookies should only be set in server actions or middleware, just like regular cookies.

### Reading encrypted cookies

To retrieve the value of an encrypted cookie, use the asynchronous `cookies.encrypted.get()` function:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export default async function Page() {
  // Read the value of an encrypted cookie
  let value = await cookies.encrypted.get("my-encrypted-cookie");

  return <p>The value of `my-encrypted-cookie` is {value}</p>;
}
```

The `get` function is asynchronous and must be awaited to retrieve the cookie value.

If the cookie does not exist or has been tampered with, `cookies.encrypted.get()` will return undefined.

### Storing complex data with encrypted cookies

Encrypted cookies in Twofold can store more than just strings — they support any serializable value, including objects and arrays. This is useful for securely handling complex data structures like user profiles, preferences, or session data.

```tsx
import cookies from "@twofold/framework/cookies";

await cookies.encrypted.set("features", ["new-ui", "beta-user"]);
await cookies.encrypted.set("user", { id: 1, name: "Alice" });

// and in a later request...

let features = await cookies.encrypted.get("features");
console.log(features); // => ["new-ui", "beta-user"]

let user = await cookies.encrypted.get("user");
console.log(user); // => { id: 1, name: "Alice" }
```

Any data that is serializable can be stored in an encrypted cookie.

### Browser storage

Encrypted cookies are securely stored in the browser but are designed to be unreadable by humans. This ensures that sensitive information remains private and protected, even if accessed directly.

Consider the following example:

```tsx
import cookies from "@twofold/framework/cookies";

// Set an encrypted cookie
await cookies.encrypted.set("name", "value");
```

This will result in a cookie stored in the browser with the following structure:

```text
Cookie name: tfec_name
Cookie value: JNwvQWbZRywFfXiW:6WmwprMrl8J41j6LwRIcTsagSKp81U5MF50lV8QrHtAEA+SunFO7rClE2lbrxBeEzlg=
```

The cookie value is encrypted, making it impossible for humans to interpret directly. This protects sensitive data like user session information.

If an encrypted cookie is tampered with, the server will detect the alteration and reject the cookie. This ensures data integrity and prevents unauthorized modifications.

### Destroying encrypted cookies

Similar to regular cookies, encrypted cookies can be destroyed using the `cookies.encrypted.destroy` function:

```tsx
// app/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function destroyCookie() {
  "use server";

  // Destroying the encrypted cookie
  cookies.encrypted.destroy("my-encrypted-cookie");
}
```
