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

Just like the `<a>` tag, the `<Link>` component accepts an `href` prop that specifies the URL of the page to navigate to. The only requirement for the `href` prop is that it must be a page within your application and not an external link.

## Props

There are a handful of props that can be passed to the `<Link>` component to customize its behavior.

| Prop       | Type                     | Description                                                                                                        |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `href`     | `string`                 | The URL of the page to navigate to.                                                                                |
| `replace`  | `boolean`                | Default `false`. If `true`, the current page will be replaced in the history stack instead of pushing a new entry. |
| `ref`      | `Ref<HTMLAnchorElement>` | A ref to the underlying anchor element.                                                                            |
| `children` | `ReactNode`              | The content of the link.                                                                                           |
