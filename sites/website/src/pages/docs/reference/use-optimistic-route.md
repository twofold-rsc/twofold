# useOptimisticRoute

The `useOptimisticRoute` hook lets client components to peek into the future state of the router. This hook is used to check if the router is transitioning, and if so what page is being loaded.

## Usage

To use the `useOptimisticRoute` hook:

```tsx
// src/pages/client-component.tsx

"use client";

import { useRouter } from "@twofold/framework/use-router";
import { useOptimisticRoute } from "@twofold/framework/use-optimistic-route";

export default function ClientComponent() {
  let router = useRouter();
  let optimisticRoute = useOptimisticRoute();

  return (
    <div>
      <p>The current path is {router.path} and the router is...</p>

      {optimisticRoute.isTransitioning ? (
        <p>Transitioning to {optimisticRoute.path}</p>
      ) : (
        <p>Not transitioning</p>
      )}
    </div>
  );
}
```

The `useOptimisticRoute` hook can only be used in client components since it is a reactive hook that updates and re-renders as users navigate between pages.

## Transitioning state

While the router is transitioning to a new page, the `isTransitioning` property will be `true`. This is useful for styling UI elements to indicate that a page is loading.

```tsx
// src/pages/client-component.tsx

"use client";

import { Link } from "@twofold/framework/link";
import { useRouter } from "@twofold/framework/use-router";
import { useOptimisticRoute } from "@twofold/framework/use-optimistic-route";

export default function ClientComponent() {
  let router = useRouter();
  let optimisticRoute = useOptimisticRoute();

  return (
    <div>
      <Link
        href="/settings"
        className={
          optimisticRoute.isTransitioning &&
          optimisticRoute.path === "/settings" &&
          router.path !== "/settings"
            ? "animate-pulse"
            : ""
        }
      >
        Settings
      </Link>
    </div>
  );
}
```

In the example above, the `Settings` link will pulse when the user clicks the link to the page. However, the link will not pulse if the user is already on the settings page.

## Settled state

When the router is not transitioning, the `path` and `searchParams` properties will reflect the current path and search params.

```tsx
// src/pages/client-component.tsx

"use client";

import { useRouter } from "@twofold/framework/use-router";
import { useOptimisticRoute } from "@twofold/framework/use-optimistic-route";

export default function ClientComponent() {
  let router = useRouter();
  let optimisticRoute = useOptimisticRoute();

  // when the router is in a settled state...

  optimisticRoute.isTransitioning; // => false
  router.path === optimisticRoute.path; // => true
  router.searchParams === optimisticRoute.searchParams; // => true

  // ...
}
```

This is where the name "optimistic route" comes from. While transitioning, the hook provides an optimistic view of the future state of the router, but once settled it provides the current state.

## Return values

The values returned by `useOptimisticRoute`:

```tsx
// src/pages/client-component.tsx

"use client";

import { useRouter } from "@twofold/framework/use-router";

function ClientComponent() {
  let { isTransitioning, path, searchParams } = useOptimisticRoute();

  // ...
}
```

The `useOptimisticRoute` hook returns an object with the following properties:

| Property          | Type              | Description                                                     |
| ----------------- | ----------------- | --------------------------------------------------------------- |
| `path`            | `string`          | The future path of the router.                                  |
| `searchParams`    | `URLSearchParams` | The future search params.                                       |
| `isTransitioning` | `boolean`         | A boolean that flips to true when the router is loading a page. |
