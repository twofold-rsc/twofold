# useRouter

The `useRouter` hook provides client components access to Twofold's router. This hook is used to navigate between pages, preform refreshes, and access the current route.

## Usage

To use the `useRouter` hook:

```tsx
"use client";

import { useRouter } from "@twofold/framework/use-router";

export default function ClientComponent() {
  let router = useRouter();

  return <p>The current path is {router.path}</p>;
}
```

The `useRouter` hook can only be used in client components since it is a reactive hook that updates and re-renders as users navigate between pages.

## Navigation

Programmatic navigation can be achieved by calling the `navigate` or `replace` functions from `useRouter`:

```tsx
"use client";

import { useRouter } from "@twofold/framework/use-router";
import { useEffect } from "react";

export default function ClientComponent() {
  let { navigate } = useRouter();

  useEffect(() => {
    let id = setTimeout(() => {
      navigate("/new-page");
    }, 1_000 * 60);

    return () => {
      clearTimeout(id);
    };
  }, [navigate]);

  return <p>You can only read this page for 1 minute, then we kick you out!</p>;
}
```

In the example above, the user will automatically navigate to `/new-page` after 1 minute.

The `replace` function from `useRouter` can be used instead of `navigate`. The only difference is that unlike `navigate`, it will replace the current page in the history stack instead of pushing a new entry.

## Refreshing Pages & Layouts

The `refresh` function from `useRouter` can be used to refresh the current page and its layouts:

```tsx
"use client";

import { useRouter } from "@twofold/framework/use-router";
import { useEffect } from "react";

export default function ClientComponent() {
  let { refresh } = useRouter();

  useEffect(() => {
    let id = setInterval(() => {
      refresh();
    }, 1_000 * 60);

    return () => {
      clearTimeout(id);
    };
  }, [refresh]);

  return <p>Data will be updated every minute!</p>;
}
```

This component will refresh the data fetched from the page and layouts once a minute. The `refresh` function will only update the data from server components, it leaves data and state associated with client components intact.

## Return values

The functions and values returned by `useRouter`:

```tsx
"use client";

import { useRouter } from "@twofold/framework/use-router";

function ClientComponent() {
  let { path, searchParams, navigate, replace, refresh } = useRouter();

  // ...
}
```

The `useRouter` hook returns an object with the following properties:

| Property       | Type                     | Description                                                  |
| -------------- | ------------------------ | ------------------------------------------------------------ |
| `path`         | `string`                 | The current path of the router.                              |
| `searchParams` | `URLSearchParams`        | The current search params of the router.                     |
| `navigate`     | `(path: string) => void` | A function to navigate to a new page.                        |
| `replace`      | `(path: string) => void` | A function to replace the current page in the history stack. |
| `refresh`      | `() => void`             | A function to refresh the current page and its layouts.      |
