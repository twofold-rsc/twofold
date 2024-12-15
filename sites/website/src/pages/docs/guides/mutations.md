# Mutations

Data can be created, updated, and destroyed using [React Server Functions](https://react.dev/reference/rsc/server-functions). These are special functions that are called on the client, but executed on the server.

This guide demonstrates how to mutate data using a mock `./database` module, which you can replace with an ORM or database client of your choice.

## Server functions

Server functions use the `"use server"` directive, which ensures that the code in these functions executes on the server.

### Example: Creating a post

Let's create a server function that inserts a new post into the database:

```tsx
// src/pages/posts.page.tsx

import { db } from "./database";

async function createPost(formData: FormData) {
  "use server";

  let title = formData.get("title");
  let content = formData.get("content");

  await db.exec(
    "INSERT INTO posts (title, content) VALUES (?, ?)",
    title,
    content,
  );
}

export async function PostsPage() {
  let allPosts = await db.query("SELECT * FROM posts");

  return (
    <div>
      <form action={createPost}>
        <input
          name="title"
          placeholder="Title"
          className="border border-gray-300"
        />
        <textarea
          name="content"
          placeholder="Content"
          className="border border-gray-300"
        />
        <button type="submit">Create Post</button>
      </form>

      <ul>
        {allPosts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

In this example, submitting the form creates a new post and re-renders the list of posts to include the new entry.

## Server modules

Server functions can be placed inside of server modules, which is any module that starts with the `"use server"` directive.

When using a server module all functions exported from the module become server functions.

### Example: Using a Server Module

```tsx
// src/pages/posts/mutations.ts

"use server";

import { db } from "./database";

async function createPost(formData: FormData) {
  let title = formData.get("title");
  let content = formData.get("content");

  await db.exec(
    "INSERT INTO posts (title, content) VALUES (?, ?)",
    title,
    content,
  );
}
```

Now any component can import and use the `createPost` function:

```tsx
// src/pages/posts/index.page.tsx

import { db } from "./database";
import { createPost } from "./mutations";

export async function PostsPage() {
  let allPosts = await db.query("SELECT * FROM posts");

  return (
    <div>
      <form action={createPost}>
        <input
          name="title"
          placeholder="Title"
          className="border border-gray-300"
        />
        <textarea
          name="content"
          placeholder="Content"
          className="border border-gray-300"
        />
        <button type="submit">Create Post</button>
      </form>

      <ul>
        {allPosts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Just like before, submitting the form creates a new post and updates the displayed list.

A benefit to using server modules is that they can be imported by both server and client components.

## Dynamic data

Server functions that need to work with dynamic data can be defined inside of render and close over any of the component's props or variables.

### Example: Updating a Post

Here's an example of how to update a post in the database:

```tsx
// src/pages/posts/$slug.page.tsx

export default function PostsSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  let post = await db.query("SELECT * FROM posts WHERE slug = ?", params.slug);

  async function updatePost(formData: FormData) {
    "use server";

    let title = formData.get("title");
    let content = formData.get("content");

    await db.exec(
      "UPDATE posts SET title = ?, content = ?, updatedAt = ? WHERE id = ?",
      title,
      content,
      new Date().toISOString(),
      post.id,
    );
  }

  return (
    <div>
      <p>This post was last updated at {post.updatedAt}.</p>
      <form action={updatePost}>
        <input type="hidden" name="id" value={post.id} />
        <input
          name="title"
          placeholder="Title"
          defaultValue={post.title}
          className="border border-gray-300"
        />
        <textarea
          name="content"
          placeholder="Content"
          defaultValue={post.content}
          className="border border-gray-300"
        />
        <button type="submit">Update Post</button>
      </form>
    </div>
  );
}
```

Notice how the `updatePost` function knows which post to update because it closes over the selected `post.id` variable.

Now when the form is submitted, the post is updated in the database, and the page refreshes to show the updated timestamp.
