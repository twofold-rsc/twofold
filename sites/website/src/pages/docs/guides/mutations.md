# Mutations

Data can be created, updated, and destroyed using Server Actions. These are special functions that are called on the client, but executed on the server.

This guide will show you how to mutate data using a made up `./database` module. You can substitute this with an ORM or database client of your choice.

## Server actions

Server actions are functions marked with the `"use server"` directive. This directive tells Twofold that the function is going to mutate data that lives on the server.

Let's create a server action that inserts a new post into the database:

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

The above example will create a new post whenever the form is submitted and then re-render the lists of posts with the new post included.

## Server action modules

Server actions can be defined in separate modules and imported into your components. A server action module is any module that begins with the `"use server"` directive.

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

Now any component can import the `createPost` function and use it to create a new post.

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

Like the previous example, this will create a new post whenever the form is submitted and then re-render the lists of posts with the new post included.

## Dynamic data

Server actions that need access to dynamic data can use hidden form fields to pass that data to the server.

Let's create a server action that updates a post in the database:

```tsx
// src/pages/posts/$slug.page.tsx

async function updatePost(formData: FormData) {
  "use server";

  let id = formData.get("id");
  let title = formData.get("title");
  let content = formData.get("content");

  await db.exec(
    "UPDATE posts SET title = ?, content = ?, updatedAt = ? WHERE id = ?",
    title,
    content,
    new Date().toISOString(),
    id,
  );
}

export default function PostsSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  let post = await db.query("SELECT * FROM posts WHERE slug = ?", params.slug);

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

Whenever the form is submitted the post will be updated in the database and the page will re-render with the date of the last update.

It's recommended to use hidden form inputs when working with dynamic data. This allows you to be explicit with the data you are passing between the client and server.

## Limitations

Server actions in Twofold are only allowed to be defined in the top-level scope of a module. This means that you cannot define server actions inside of components, other functions, or closures. This is a limitation of the current implementation and may change in the future.
