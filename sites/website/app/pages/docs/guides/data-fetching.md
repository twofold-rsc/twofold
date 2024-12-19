# Data fetching

In Twofold, data fetching is done in React Server Components.

At the moment, Twofold does not have a built-in data fetching library. This guide will show you how to fetch data using a made up `./database` module. You can substitute this with an ORM or database client of your choice.

## Fetching data in pages

Pages that export asynchronous components can fetch data before rendering.

```tsx
// app/pages/sales.page.tsx

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

## Fetching data in layouts

Similar to pages, layouts can also fetch data. This useful for data that is rendered across multiple pages.

```tsx
// app/pages/posts/layout.tsx

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

In the above example, a list of all blog posts will be displayed on every page alongside the content of the selected post.

## Navigation and data fetching

Whe users navigate between pages Twofold will always rerun any rendered layouts and refetch their data. This is helpful for keeping data up to date as users move through your site.
