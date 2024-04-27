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

## Dynamic data

## Binding data

## Limitations
