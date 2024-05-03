# Redirects

In Twofold redirects can happen in pages, layouts, server components, actions, and middleware.

## Pages & Layouts

Redirect when rendering a page or layout:

```tsx
// src/pages/posts/$slug.page.tsx

import { redirect } from "@twofold/framework/redirect";
import { PageProps } from "@twofold/framework/types";
import { db } from "./database";

export default function PostPage({ slug }: PageProps<"slug">) {
  let post = db.query("SELECT * FROM posts where slug = ?", slug);

  if (!post) {
    // post doesn't exist, send user back to index page
    redirect("/posts");
  }

  // ...
}
```

By default redirects from pages, layouts, and server components will use status code 307 (temporary redirect).

Use the `{ permanent: true }` option to create a redirect using the 308 status code.

```tsx
redirect("/posts", { permanent: true });
```

## Actions

Redirect from server actions:

```tsx
// src/pages/posts/mutations.ts

"use server";

import { redirect } from "@twofold/framework/redirect";
import { db } from "./database";

async function createPost(formData: FormData) {
  let title = formData.get("title");
  let content = formData.get("content");

  let post = await db.exec(
    "INSERT INTO posts (title, content) VALUES (?, ?)",
    title,
    content,
  );

  // redirect to the post page for the newly created post
  redirect(`/posts/${post.id}`);
}
```

Redirects from server actions will always use the 303 (see other) status code. This status code is not changeable.

## Middleware

Redirect from middleware:

```tsx
// src/pages/posts/$slug.page.tsx

import { redirect } from "@twofold/framework/redirect";
import { PageProps } from "@twofold/framework/types";

export async function before({ params }: PageProps<"slug">) {
  if (params.slug === "old-post-slug") {
    redirect("/posts/new-post-slug");
  }
}

export default function PostPage({ slug }: PageProps<"slug">) {
  // ...
}
```

A benefit of using redirects in middleware is that the redirect will happen before the layout and page components are executed.

## Client components

It is recommend to perform all redirects on the server, since the `redirect` function cannot be called from the client. However, if you need to redirect from a client component, you can use the `useRouter` hook.

```tsx
"use client";

export function MyComponent() {
  let { replace } = useRouter();

  useEffect(() => {
    replace("/posts");
  }, [replace]);

  return null;
}
```

In the above example, rendering `<MyComponent>` will redirect the user to the `/posts` page.
