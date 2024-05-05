# Cookies

Twofold has built in support for reading, setting, and destroying cookies.

## Reading cookies

Cookies can be read in Twofold using the cookie module:

```tsx
// src/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

export default function IndexPage() {
  const cookie = cookies.get("my-cookie");

  return <p>The value of `my-cookie` is {cookie}</p>;
}
```

Cookies can be read in pages, layouts, server components, actions, and middleware.

## Setting cookies

To set cookies:

```tsx
// src/pages/index.page.tsx

import cookies from "@twofold/framework/cookies";

async function setCookie() {
  "use server";

  cookies.set("my-cookie", "cookie-value-here", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
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
// src/pages/index.page.tsx

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

## Destroying cookies

To destroy cookies:

```tsx
// src/pages/index.page.tsx

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
