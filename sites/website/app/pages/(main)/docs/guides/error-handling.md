# Error handling

Twofold has built in support for handling both unexpected and expected errors.

## Unexpected errors

Unexpected errors are unhandled exceptions that are thrown while rendering components or running actions.

An example of an unexpected error is when a page component that relies on a database throws an exception because the database server is offline.

```tsx
// app/pages/products/index.page.tsx

export default function ProductsPage() {
  let products = await db.query.products.findMany();
  // if db.query fails then the above line will throw an error

  return <div>This won't render if the database is down...</div>;
}
```

While it's possible that you know this type of exception can happen, it is almost always unexpected. It's unlikely you'd want to wrap all of your database queries in try-catch statements to handle the database being offline.

These types of errors are unexpected because you either did not know they were possible or do not expect them to happen in a well functioning app.

When an unexpected error happens in Twofold, the page's unexpected error component will render in place of the page. This is the closest `unexpected.error.tsx` to the page component.

```tsx
// app/pages/products/unexpected.error.tsx

"use client";

export default function ErrorComponent() {
  return <div>An unexpected error occurred.</div>;
}
```

For example, if the above `ProductsPage` throws an unexpected exception, then it's sibling `unexpected.error.tsx` component will render in it's place. In this case, users will see a message with _"An unexpected error occurred."_

```text
app
└─ pages
   └─ products
      ├─ index.page.tsx
      └─ unexpected.error.tsx
```

If no sibling `unexpected.error.tsx` file exists then the `unexpected.error.tsx` in the nearest parent directory will be used.

### Root unexpected error component

A single `unexpected.error.tsx` in the root pages directory can be used for any unexpected error thrown in your application.

```text
app
└─ pages
   ├─ products
   │  └─ index.page.tsx
   └─ unexpected.error.tsx
```

This allows you to customize what is shown whenever your application throws an uncaught exception. If there are multiple `unexpected.error.tsx` components then the one closest to the page component is used.

### Error component details

The `unexpected.error.tsx` file must export a client component.

```tsx
// app/pages/unexpected.error.tsx

"use client";

export default function ErrorComponent() {
  return <div>An unexpected error occurred.</div>;
}
```

This component receives `ErrorProps` containing the thrown `error` as well as a `reset` function that allows you to unmount the error component and attempt to rerender the page.

```tsx
// app/pages/unexpected.error.tsx

"use client";

import { ErrorProps } from "@twofold/framework/types";

export default function ErrorComponent({ error, reset }: ErrorProps) {
  let { refresh } = useRouter();

  function tryAgain() {
    startTransition(() => {
      reset();
      refresh();
    });
  }

  return (
    <div>
      <p>An unexpected error occurred.</p>
      <button onClick={tryAgain}>Try again</button>
    </div>
  );
}
```

Even if you are not using any client features this module must be marked with `"use client"`. This is because under the hood these components are controlled by React Error Boundaries, which only work as client components.
