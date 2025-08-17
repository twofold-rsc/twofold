# Layouts

Layouts are React Server Components that wrap your page components. They contain common elements such as headers, footers, and navigation menus that are shared across multiple pages.

Layouts are always named `layout.tsx` and are placed in the `app/pages` directory alongside your pages.

## Root layout

The root layout in your application is the layout that wraps every page component. It's the first layout that is rendered when visiting a URL.

```tsx
import "./global.css";
import TwofoldFramework from "@twofold/framework/twofold-framework";
import { LayoutProps } from "@twofold/framework/types";

export default function Layout({ children }: LayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
      <TwofoldFramework />
    </html>
  );
}
```

The only requirement for the root layout is that it must import and render the `<TwofoldFramework>` component. This component is responsible for bootstrapping your application.

It's best to keep your root layout as simple as possible. You can add additional layouts to your application to handle more complex layouts.

## Nested layouts

Layouts that are nested will create a hierarchy of layouts. When a page component is rendered, it is wrapped by the root layout, followed by any layouts that exist in the directory hierarchy leading to the page.

```tsx
// app/pages/posts/layout.tsx

import { LayoutProps } from "@twofold/framework/types";

export default function PostsLayout({ children }: LayoutProps) {
  return (
    <div>
      <header>Posts Header</header>
      {children}
      <footer>Posts Footer</footer>
    </div>
  );
}
```

The above `PostsLayout` component wraps the page components in the `app/pages/posts` directory. When visiting a URL under `/posts`, the `PostsLayout` component will be rendered.

Layout nesting can be infinitely deep. Visiting the URL `/posts/comments/:commentId` will render the posts layout component, followed by the comments layout component, and then finally the comment page component.

## Children

Layouts receive a `children` prop that contains the child layouts and page component for the URL being rendered. This prop is a React Node that is analogous to the `children` prop in React components.

Layout components will re-render and receive new children as you navigate around the application.

## Props

In addition to the `children` prop, layouts receive the same props passed to pages:

| Prop           | Type                                                                                  | Description                             |
| -------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `children`     | `ReactNode`                                                                           | The child layouts and page component    |
| `params`       | `Record<string, string \| undefined>`                                                 | The dynamic params in the URL           |
| `searchParams` | [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) | The query params in the URL             |
| `url`          | [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL)                         | The URL of the request                  |
| `request`      | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)                 | The request object for the HTTP request |

## Types

A special `LayoutProps` type can be imported from `@twofold/framework/types` that provides types for the props passed to pages.

```tsx
// app/pages/posts/layout.tsx

import { LayoutProps } from "@twofold/framework/types";

export default function PostsLayout(props: LayoutProps) {
  // ...
}
```

## URL mapping

The table below serves as a reference for how URLs map to layout components. Each layout in the `app/pages` directory is listed with the URL it will render.

| Layout file                 | URL pattern        |
| --------------------------- | ------------------ |
| `layout.tsx`                | /\*                |
| `posts/layout.tsx`          | /posts/\*          |
| `posts/comments/layout.tsx` | /posts/comments/\* |
