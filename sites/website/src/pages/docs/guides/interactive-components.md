# Interactive components

Interactive components are what bring an application's UI to life. These components are long lived, run effects, and re-render whenever their state changes.

## Client components

Client components allow you to build rich interactive UIs. These components are exported from a module marked with the `"use client"` directive.

Here's an example of the simplest client component, a counter:

```tsx
"use client";

export function Counter() {
  let [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

The above component runs on the client and will instantly re-render when the "Increment" button is pressed.

## Passing data to client components

Client components can be imported and rendered by server components. A common pattern is to use server components to fetch data, then pass that data into client components for interactivity.

Here a page component fetches a list of posts and hands them off to a client component:

```tsx
// src/pages/posts/index.page.tsx

import { db } from "./database";
import { PostsList } from "./posts-list";

export async function PostsPage() {
  let allPosts = await db.query("SELECT * FROM posts");

  return (
    <div>
      <h1>Posts</h1>

      <PostsList posts={posts} />
    </div>
  );
}
```

The `PostList` component then allows a user to select a post:

```tsx
// src/pages/posts/post-list.tsx

"use client";

export function PostsList({ posts }) {
  let [selected, setSelected] = useState(null);

  return (
    <ul>
      {posts.map((post) => (
        <li
          key={post.id}
          className={selected === post ? "bg-blue-500 text-white" : ""}
        >
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <button onClick={() => setSelected(post)}>Select</button>
        </li>
      ))}
    </ul>
  );
}
```

Now whenever a post is selected the application will re-render and highlight the selected post.

This pattern allows you to build complex interactive UIs by composing client components with server components.

## SSR

## Cannot render server components

## Invoking server actions
