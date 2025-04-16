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

  function navigateOnClick() {
    navigate("/new-page");
  }

  return <button onClick={navigateOnClick}>Go to new page</button>;
}
```

## Replacing pages

The `replace` function from `useRouter` can be used instead of `navigate`. The only difference is that unlike `navigate`, it will replace the current page in the history stack instead of pushing a new entry.

```tsx
"use client";

import { useRouter } from "@twofold/framework/use-router";
import { useEffect } from "react";

export default function ClientComponent() {
  let { replace } = useRouter();

  function replaceOnClick() {
    replace("/new-page");
  }

  return <button onClick={replaceOnClick}>Replace page</button>;
}
```

## Refreshing Pages & Layouts

The `refresh` function from `useRouter` is used to refresh the current page and its layouts:

```tsx
"use client";

import { useRouter } from "@twofold/framework/use-router";
import { useEffect } from "react";

export default function ClientComponent() {
  let { refresh } = useRouter();

  return <button onClick={refresh}>Refresh page</button>;
}
```

The `refresh` function will only update the data from server components, it leaves data and state associated with client components intact.

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

| Property       | Type                                                | Description                                                  |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `path`         | `string`                                            | The current path of the router.                              |
| `searchParams` | `URLSearchParams`                                   | The current search params of the router.                     |
| `navigate`     | `(path: string, options?: NavigateOptions) => void` | A function to navigate to a new page.                        |
| `replace`      | `(path: string, options?: NavigateOptions) => void` | A function to replace the current page in the history stack. |
| `refresh`      | `() => void`                                        | A function to refresh the current page and its layouts.      |

### Navigate options

The following options can be passed to the `navigate` and `replace` functions:

| Option   | Type                  | Description                                                                        |
| -------- | --------------------- | ---------------------------------------------------------------------------------- |
| `scroll` | `'top' \| 'preserve'` | Default `top`. If `preserve` the page will not scroll to the top after navigation. |
| `mask`   | `string`              | When set this path will be used in the browser's location bar.                     |
