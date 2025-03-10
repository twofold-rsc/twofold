# Pages

Every URL in your application is powered by a page component. These are special React Server Components that serve as entry points into your application.

## Page components

Page components are responsible for rendering the content users see when visiting URLs in your application. These components are exported from a module in the `app/pages` directory that ends with `.page.tsx`.

```tsx
// app/pages/about.page.tsx

export default function AboutPage() {
  return <div>Welcome to my application!</div>;
}
```

Visiting `/about` renders the above `AboutPage` component.

## Index pages

Pages nested under directories create a hierarchy of URLs. When a directory contains an `index.page.tsx` file it is used to render the URL of the directory.

```tsx
// app/pages/posts/index.page.tsx

export default function PostsIndexPage() {
  return <div>Posts Index Page</div>;
}
```

Visiting `/posts` will render the `PostsIndexPage` component.

## Dynamic pages

Pages can contain dynamic params in their URLs. These params are denoted by a `$` followed by the name of the param.

```tsx
// app/pages/posts/$slug.page.tsx

import { PageProps } from "@twofold/framework/types";

export default function PostsSlugPage({ params }: PageProps<"slug">) {
  return <div>You are viewing: {params.slug}</div>;
}
```

The above `PostsSlugPage` component will be rendered when visiting `/posts/hello-world`, `/posts/another-post`, or any other URL that matches the pattern `/posts/:slug`.

## Props

Every page component is given a handful of props when rendered.

| Prop           | Type                                                                                  | Description                             |
| -------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `params`       | `Record<string, string \| undefined >`                                                | The dynamic params in the URL           |
| `searchParams` | [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) | The query params in the URL             |
| `request`      | [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)                 | The request object for the HTTP request |

It is important to note that these params are immutable and should not be modified. Changing these values does not have any effect on the URL or the page's state and can lead to unexpected behavior.

## Types

A special `PageProps` type can be imported from `@twofold/framework/types` that provides types for the props passed to pages.

This type can take a type argument that represents the dynamic params in the URL.

```tsx
// app/pages/posts/$slug.page.tsx

import { PageProps } from "@twofold/framework/types";

export default function PostsSlugPage(props: PageProps<"slug">) {
  // ...
}
```

And for pages without dynamic params, the `PageProps` type can be used without any type arguments.

```tsx
// app/pages/posts/index.page.tsx

import { PageProps } from "@twofold/framework/types";

export default function PostsSlugPage(props: PageProps) {
  // ...
}
```

## URL mapping

The table below serves as a reference for how URLs map to page components. Each page in the `app/pages` directory is listed with the URL it will render.

| Page file              | URL            |
| ---------------------- | -------------- |
| `index.page.tsx`       | `/`            |
| `about.page.tsx`       | `/about`       |
| `posts/index.page.tsx` | `/posts`       |
| `posts/$slug.page.tsx` | `/posts/:slug` |
