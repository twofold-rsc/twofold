# Link

The `<Link>` component is used to navigate between pages in your app.

## Usage

Links can be rendered by both server and client components.

```tsx
// app/pages/index.page.tsx

import Link from "@twofold/framework/link";

export default function IndexPage() {
  return (
    <div>
      <h1>Home</h1>
      <Link href="/about">About</Link>
    </div>
  );
}
```

Just like the `<a>` tag, the `<Link>` component accepts an `href` prop that specifies the URL to navigate to.

## Props

There are a handful of props that can be passed to the `<Link>` component to customize its behavior.

| Prop       | Type                  | Description                                                                                                        |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `href`     | `string`              | The URL of the page to navigate to.                                                                                |
| `replace`  | `boolean`             | Default `false`. If `true`, the current page will be replaced in the history stack instead of pushing a new entry. |
| `scroll`   | `'top' \| 'preserve'` | Default `top`. When `preserve` the the page will not scroll to the top after navigation.                           |
| `mask`     | `string`              | When set this path will be used in the browser's location bar.                                                     |
| `as`       | `ElementType`         | Default `a`. The element to render.                                                                                |
| `children` | `ReactNode`           | The content of the link.                                                                                           |
