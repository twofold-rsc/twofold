# Data fetching

In Twofold, data fetching is done in React Server Components, namely [Pages](/docs/guides/pages) and [Layouts](/docs/guides/layouts).

At the moment, Twofold does not have a built-in data fetching library. This guide will show you how to fetch data using a made up `./database` module. You can substitute this with an ORM or database client of your choice.

## Fetching data in pages

Pages that export asynchronous components can fetch data before rendering.

```tsx
// src/pages/sales.page.tsx

import { db } from "./database";

export default async function SalesPage() {
  let totalSales = await db.exec("SELECT count(1) FROM sales");

  return (
    <div>
      <h1>Sales</h1>
      <p>We've made {totalSales} sales!</p>
    </div>
  );
}
```

Twofold will wait for the total count of sales to be fetched from the database before rendering the above page.

## List detail UIs

Similar to pages, layouts can also fetch data. This useful for data that is shared across multiple pages.

A common UI pattern is to fetch a list of items and then display an item's details once it's selected. In Twofold, this is done by fetching the list in a layout and the details of a specific item in a dynamic page.

Let's go ahead and build a list-detail UI using a layout and page. First, we'll start with the layout:

```tsx
// src/pages/posts/layout.tsx

import { db } from "./database";
import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default async function PostsLayout({
  children,
}: {
  children: ReactNode;
}) {
  let allPosts = await db.exec("SELECT * FROM posts");

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>

      <div>{children}</div>
    </div>
  );
}
```

And next we'll create an index page that instructs the user to select a post.

```tsx
// src/pages/posts/index.page.tsx

import { db } from "./database";

export default async function PostsIndexPage() {
  return <p>Select a post from the list to read it!</p>;
}
```

When visiting `/posts` both the layout and index page will be rendered. A user will see a list of posts and a message to select a post.

Finally, we'll create a page component that renders the details of a post whenever a link is clicked.

```tsx
// src/pages/posts/$slug.page.tsx

import { db } from "./database";

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  let post = await db.exec("SELECT * FROM posts where slug = ?", params.slug);

  return (
    <div>
      <h1>{post.title}</h1>
      <article>{post.content}</article>
    </div>
  );
}
```

Now a user that clicks on a post in the list will see the details of the post. The list of all posts will remain visible as the user navigates between post pages.
