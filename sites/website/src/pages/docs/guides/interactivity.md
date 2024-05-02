# Interactivity

Interactivity is what brings an application's UI to life. In Twofold, all interactivity begins with client components.

## Client components

When a page or layout imports a component, that component will run on the server. If you want a component rendered from a server component to be executed on the client then it must be marked with the `"use client";` directive.

Here's an example of a component tree that starts it's rendering on the server, but then seamlessly transitions to the client.

Let's start with a page component that executes SQL on the server:

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

This component fetches a list of posts and hands them off to `PostsLists`, which is a client component:

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

The `"use client";` directive at the top of the `PostList` component tells Twofold that this component needs to execute on the client. This component does not run in the same process as our page component, instead it is sent to the client and executed there.

A user visiting the posts page will have the `PostList` component running in their browser. As soon as they select a post the component will set state in the browser and instantly re-render.

It's worth highlighting how easy it was to move from the server to the client in this example. Our page executes on the server in a trusted environment that has access to the database, but we're able to quickly move execution to the client by rendering `<PostList>`.

There's no need for API endpoints or client-side data fetching libraries, we simply render client components when we want to move execution from the server to the client.

Another point to highlight is that we can seamlessly pass data from the server into client components using props. In the example above we pass the database query result into the `PostList` component as a prop.

## When to "use client"

Marking components with `"use client";` should only be used to move execution from the server to the client. You can think of rendering a client component as a way of declaring that you want to leave the server and enter the client.

Reasons for wanting to leave the server and enter the client include:

- Reactivity and state: Components that use hooks like `useState` or `useEffect` can only run on the client.

- Browser specific APIs: Components that depend on browser APIs like `localStorage` or `addEventListener` cannot run on the server.

Components imported by other client components do not need to be marked with `"use client";`. The directive is only needed when moving execution from the server to the client. Since a client component is already running on the client, marking its imports with `"use client";` is meaningless.

## Server to client is one way

Server components can import and render client components, but client components cannot import server components.

Twofold's architecture first executes server components in a special server process that has access to databases and other server-side resources. During this execution phase only server components are run, client components are not executed.

What's left is a tree that contains the output of server components and unexecuted client components. You can think of this like a partially render React application. The server components have been run, their output captured, but the client components have yet to be executed.

This half rendered React tree is then sent to the client where it can finish rendering. The client executes all of the remaining client components and we are left with output from an application that was initially run on the server, but finished by the client.

This means that client components cannot import server components. The window for rendering server components has already been closed by the time the client begins its rendering.

## SSR

So far in this guide I have intentionally limited myself from using the word "browser" and instead carefully chosen to use "client" when describing where client components run.

A client is any environment that can execute a React application. The browser is certainly a client, but there are also other clients that can render React apps.

For example, Node.js can be a client. You can write a Node script that takes in a React app, executes it, and outputs HTML. In fact, Node scripts that render React applications are very common today. Many websites use a process known as server-side rendering (SSR) to render their React applications using Node. This is done so that they have HTML to initially serve to visitors and bots.

Twofold supports SSR out of the box. When a user first visits your application Twofold will execute all server components, and then all client components (in Node) so that the server can respond with a fully rendered HTML version of your application.

So, in reality client components are executed in Node (on the server), but they are executed in a different process from the one that runs server components.

It's confusing, but the take away from this section should be that the term client component does not mean browser only component.
