# Middleware

Middleware allows you to run code before rendering layouts and pages.

## Before

A page or layout can export a `before` function to run middleware before rendering:

```tsx
// src/pages/posts/index.page.tsx

export async function before() {
  console.log("Running middleware before rendering");
}

export default function IndexPage() {
  return <p>Hello, world!</p>;
}
```

A layout can also export a `before` middleware function:

```tsx
// src/pages/posts/layout.tsx

export async function before() {
  console.log("Running middleware before rendering");
}

export default function PostsLayout() {
  // ...
}
```

If a page and its layout both export a `before` middleware function, both of these functions will be run in parallel. Rendering will not start until all middleware functions have completed.

## Props

Middleware will receive the same props given to pages and layouts:

| Prop           | Type                                                                                  | Description                             |
| -------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `params`       | `Record<string, string \| undefined>`                                                 | The dynamic params in the URL           |
| `searchParams` | [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) | The query params in the URL             |
| `request`      | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)                 | The request object for the HTTP request |
