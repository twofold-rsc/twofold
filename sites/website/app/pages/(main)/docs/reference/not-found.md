# Not found

Twofold has built in support for handling and customizing not found errors.

## Pages & Layouts

Render the not found page from a page or layout:

```tsx
// app/pages/posts/$slug.page.tsx

import { notFound } from "@twofold/framework/not-found";
import { PageProps } from "@twofold/framework/types";
import { db } from "./database";

export default function PostPage({ slug }: PageProps<"slug">) {
  let post = db.query("SELECT * FROM posts where slug = ?", slug);

  if (!post) {
    notFound();
  }

  // ...
}
```

In addition to pages that invoke `notFound()`, any page that is missing from the filesystem will automatically render the not found page. For example, if a user navigates to `/missing-page` and no such page exists, then the not found page will be rendered.

## Actions

Render the not found page from a server action:

```tsx
"use server";

// app/pages/posts/mutations.ts

import { notFound } from "@twofold/framework/not-found";
import { db } from "./database";

async function updatePost(formData: FormData) {
  let id = formData.get("id");

  let post = db.query("SELECT * FROM posts where id = ?", id);

  if (!post) {
    notFound();
  }

  // ...
}
```

## Middleware

Render the not found page from middleware:

```tsx
// app/pages/posts/$slug.page.tsx

import { notFound } from "@twofold/framework/not-found";
import { PageProps } from "@twofold/framework/types";

export async function before({ params }: PageProps<"slug">) {
  if (slug === "not-found") {
    notFound();
  }
}

export default function PostPage({ slug }: PageProps<"slug">) {
  // ...
}
```

## Customizing the not found page

To customize the default not found page create a new file at `app/pages/errors/not-found.page.tsx`:

```tsx
// app/pages/errors/not-found.page.tsx

export default function NotFoundPage() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>This is a custom not found page!</p>
    </div>
  );
}
```

The not found page always renders within the root layout. It is a page component that receives the same props as normal [Pages](http://localhost:3000/docs/guides/pages#additional-props).

## Client components

Client components cannot render the not found page.
