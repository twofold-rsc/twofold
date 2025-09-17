---
publishedAt: "2025-09-15T08:00:00Z"
description: "RSC route rendering without waterfalls."
---

# Parallel and recursive route rendering

RSC routers are tricky to understand. If you're like me and coming from a traditional React background then the RSC approach to route rendering is going to surprise you the first time you see it.

For example, routes are rendered in parallel on the server and then stitched back together recursively on the client to avoid waterfalls. These sorts of patterns rarely come up in the day-to-day of building React apps, but they're essential for creating RSC routers.

I recently had the opportunity to add parallel and recursive route rendering to [Twofold]() and I think the idea is so interesting that I wanted to share it here.

But in order to understand RSC route rendering, we need to touch on a wide range of seemingly unrelated topics:

- RSC trees with layouts and pages
- Data fetching and waterfalls
- Parallel rendering
- Server component serialization
- Recursive components

These concepts all come together to create one of the most interesting RSC patterns I've had to joy to work with: Parallel and recursive route rendering.

If you've ever wanted to peek under the hood and see how RSC route rendering avoids waterfalls, then this post is for you.

## Waterfalls

Before we begin, we need to talk about one of the biggest problems RSC routers have to solve: Waterfalls.

To explain, here's a React app that's an admin area for a blog post editor.

{% code-tabs %}

```jsx {% file="app.jsx" %}
import RootLayout from "./root-layout";
import PostsLayout from "./posts-layout";
import EditPage from "./edit-page";

export function App() {
  return (
    <RootLayout>
      <PostsLayout>
        <EditPage postId={123} />
      </PostsLayout>
    </RootLayout>
  );
}
```

```jsx {% file="root-layout.jsx" %}
export default function RootLayout({ children }) {
  const user = await fetchCurrentUser();

  return (
    <div>
      <header>Welcome, {user.name}</header>
      <main>{children}</main>
    </div>
  );
}
```

```jsx {% file="posts-layout.jsx" %}
export default function PostsLayout({ children }) {
  const posts = await fetchPosts();

  return (
    <div>
      <aside>
        <ul>
          {posts.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </aside>

      <section>{children}</section>
    </div>
  );
}
```

```jsx {% file="edit-page.jsx" %}
export default function EditPage({ postId }) {
  const post = await fetchPost(postId);

  return (
    <form>
      <input defaultValue={post.title} />
      <textarea defaultValue={post.body} />

      <button type="submit">Save</button>
    </form>
  );
}
```

{% /code-tabs %}

And here's the app rendered. You can click around and edit different posts.

{% demo1 /%}

This app is made up of three different components: `RootLayout`, `PostsLayout`, and `PostEditPage`.

And if you look at the source code for each of these components you'll notice they all fetch their own data:

- `<RootLayout>` fetches the current user and displays their avatar in the header.
- `<PostsLayout>` fetches a list of all the posts and displays them in the sidebar.
- `<EditPage>` fetches the post being edited and displays it in the main content area.

This ability to colocate the data fetches within the components that need the data is one of the biggest selling points of RSCs.

But there's a problem... this combination of nested components and data fetching means that our app waterfalls.

If you haven't heard the term before, a waterfall is when a parent component fetches data and then renders a child component. That child component then fetches its own data, and renders its own child component.

This cycle of fetching and rendering creates a problem because child components do not fetch their data until their parents have finished rendering. In an app that waterfalls every child is blocked by its parent. Ultimately, this leads to a series of sequential data fetches and poor response times.

\[ demo 2, waterfall timeline \]

The term waterfall comes from the way these components appear on a rendering timeline. Since no component can render before it's parent finishes, it paints a picture that sort of looks like a waterfall.

To show you how this affects the user experience of an app I've changed each data fetch to take one second to load. Try refreshing the app, see how the components load one after the other.

{% demo3 /%}

Ouch. That's tough to watch.

An app that waterfalls has poor render performance because the total time to render is the sum of the rendering times of _all_ components. In the case above the blog post editor is not usable for three seconds.

In order to fix these waterfalls we'll need a router that runs each of these components in parallel.

## Parallel rendering

Most of the time when we think of rendering React components we think of rendering trees of nested components.

For example, here's a server rendered tree of three components all nested within each other:

```jsx
async function ComponentA({ children }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>{children}</div>;
}

async function ComponentB({ children }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>{children}</div>;
}

function ComponentC() {
  return <div>Done!</div>;
}

const stream = renderToReableStream(
  <ComponentA>
    <ComponentB>
      <CompnonentC />
    </ComponentB>
  </ComponentA>,
  clientModuleMap,
);
```

In this example a stream is created that contains the output of components `<ComponentA>`, `<ComponentB>`, and `<ComponentC>`. You may have already noticed that these components also cause a rendering waterfall.

If you've never seen `renderToReadableStream` before just know that it's an internal API from React that's used to render RSCs. This function returns a stream that contains the serialized output from the components that were passed to it.

There's one other thing to know about `renderToReadableStream`, it isn't limited to only rendering React components. In fact, it can render a wide variety of data types, including arrays and objects.

```jsx
const stream = renderToReadableStream(
  {
    hello: "world",
    object: { a: 1, b: 2 },
    list: [1, 2, 3],
  },
  clientModuleMap,
);
```

In the above example we create a stream that holds a serialized object with a string, another object, and an array. With `renderToReadableStream` we can "render" just about anything.

It wasn't obvious to me at first, but this ability to render data structures is the key to parallel rendering.

Instead of rendering a tree of components, we can render a list of components:

```jsx
async function ComponentA({ children }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>{children}</div>;
}

async function ComponentB({ children }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>{children}</div>;
}

function ComponentC() {
  return <div>Done!</div>;
}

const stream = renderToReableStream(
  [<ComponentA />, <ComponentB />, <ComponentC />],
  clientModuleMap,
);
```

Since `<ComponentA>`, `<ComponentB>`, and `<ComponentC>` are no longer nested, they all start rendering at the same time. The awaits in the first two components no longer block `<ComponentC>` from rendering.

We've sidestepped the waterfall by rendering a list of components instead of nested React tree.

Does this mean that we can fix the blog post editor by rendering a list of components instead of a React tree?

```jsx
const stream = renderToReableStream(
  [<RootLayout />, <PostsLayout />, <EditPage postId={123} />],
  clientModuleMap,
);
```

Not quite. The `<RootLayout />` and the `<PostsLayout />` both expect `children` in order to render correctly. If we render the components in a list like this the layouts won't work since the components are no longer nested.

We've got a way to render components in parallel, but we don't yet have a way to nest them. Luckily we can take advantage of how React renders server and client components to solve this.

## Server component serialization

Let's continue rendering our components in parallel, but this time we'll give the `RootLayout` and `PostsLayout` a placeholder so they have _something_ to use for children.

{% code-tabs %}

```jsx {% file="app.jsx" %}
import { Placeholder } from "./placeholder";

const stream = renderToReableStream(
  [
    <RootLayout>
      <Placeholder />
    </RootLayout>,
    <PostsLayout>
      <Placeholder />
    </PostsLayout>,
    <EditPage postId={123} />,
  ],
  clientModuleMap,
);
```

```jsx {% file="placeholder.jsx" %}
"use client";

export function Placeholder() {
  return null;
}
```

{% /code-tabs %}

The `<Placeholder />` component is just a literal placeholder for now. It's a client component that renders nothing.

If you squint at the data that's being rendered it looks just like a stack. The top most item in the stack is the `RootLayout`, followed by the `PostsLayout`, and then finally the `EditPage`.

\[ stack drawing \]

When called, `renderToReadableStream` creates a stack-like data structure, runs all of the server components, and then serializes the output into a stream. It's important to know that `renderToReadableStream` only runs server components, it leaves client components untouched.

If you could imagine the represented output of `renderToReadableStream` you might think of it as something like:

```jsx
[
  /* <RootLayout> rendered with <Placeholder> child */
  <html>
    <body>
      <header>Blog Admin</header>
      <Placeholder />
    </body>
  </html>,

  /* <PostsLayout> rendered with <Placeholder> child */
  <main>
    <ul>
      <li>Post 1</li>
      <li>Post 2</li>
      <li>Post 3</li>
    </ul>
    <div>
      <Placeholder />
    </div>
  </main>,

  /* <EditPage postId={123}> rendered */
  <form>
    <input name="title" value="Post 123" />
    <textarea>The content for post 123.</textarea>
  </form>,
];
```

In this imagined payload, all server components have been executed, but client components have not yet run. {% footnote id="1" %}The example above is just a representation of the output from `renderToReadableStream`. In reality, the output is a [ReadableStream]() that contains a text-based wire format. This wire format isn't readable for humans, so I didn't want to show it here. However, the wire format is similar to the example above in that it contains rendered server components and unrendered references to client components.{% /footnote %}

In the output above you'll also see each layout renders a placeholder where it's children should be. What's so interesting about this is that the actual children are the very next item in the stack.

In fact, you could imagine `<Placeholder />` being a component that simply pulls in and renders the next item in the stack. In other words, `<Placeholder />` is a literal placeholder for what's rendered next.

This is how we're going to turn these parallel rendered server components back into a nested tree. We'll use the `<Placeholder />` component to pull in the real children.

## Recreating the stack

Right now our stack is rendered into a stream using React's `renderToReadableStream` API. We need to turn it from a stream back into a stack.

The opposite of `renderToReadableStream` is a function available to React clients aptly named `createFromReadableStream`. This function takes the serialized output from `renderToReadableStream` and turns it back into a real JavaScript data structure.

```jsx
// on the server
const stream = renderToReadableStream([
  <RootLayout>
    <Placeholder />
  </RootLayout>,
  <PostsLayout>
    <Placeholder />
  </PostsLayout>,
  <EditPage postId={123} />,
]);

// [!client-boundary]

// and then on the client
const stack = await createFromReadableStream(stream);
```

Now the client has the actual stack data structure that was created by the server:

```jsx
[
  /* <RootLayout> rendered with <Placeholder> child */
  <html>
    <body>
      <header>Blog Admin</header>
      <Placeholder />
    </body>
  </html>,

  /* <PostsLayout> rendered with <Placeholder> child */
  <main>
    <ul>
      <li>Post 1</li>
      <li>Post 2</li>
      <li>Post 3</li>
    </ul>
    <div>
      <Placeholder />
    </div>
  </main>,

  /* <EditPage postId={123}> rendered */
  <form>
    <input name="title" value="Post 123" />
    <textarea>The content for post 123.</textarea>
  </form>,
];
```

At this point it's up to the client to render this payload and run all of its client components. However, since the data is represented as a stack, and not a tree, we can't just render it as is. We'll first need to use one of the coolest patterns in React, recursive components, to turn this stack into a renderable tree.

## Recursive components

We're going to create a recursive component that renders the first item in the stack. Then every time it sees a `<Placeholder />` component it'll pop the next item off the stack and render it in place of the placeholder. This will recursively iterate through the stack until there's nothing left to render.

{% stack-to-nested /%}

To get started, let's feed the stack into a React component conveniently named `<StackReader>`

```jsx
// on the server
const stream = renderToReadableStream([
  <RootLayout>
    <Placeholder />
  </RootLayout>,
  <PostsLayout>
    <Placeholder />
  </PostsLayout>,
  <EditPage postId={123} />,
]);

// [!client-boundary]

// and then on the client
const stack = await createFromReadableStream(stream);

<StackReader stack={stack} />;
```

Here's the `<StackReader>` component:

```jsx {% file="stack-reader.jsx" %}
import { createContext } from "react";

export const StackContext = createContext([]);

function StackReader({ stack }) {
  const [first, ...rest] = stack;
  return <StackContext stack={rest}>{first}</StackContext>;
}
```

This component pops the first item off the stack and renders it. In our example that's the `<RootLayout>` and it's `<Placerholder>` child. It then takes the rest of the stack and puts those items into a context.

Now for the recursive bit, we'll use the `<Placeholder>` component to start the whole process all over again. It'll render the `<StackReader>` component, which pops the next item off the stack and renders it. Rinse and repeat.

```jsx {% file="placeholder.jsx" %}
"use client";

import { StackContext } from "./stack-reader";

export function Placeholder() {
  const stack = useContext(StackContext);

  return <StackReader stack={stack} />;
  //      ^- this pops the stack and renders the next item
}
```

Every time we render a `<Placeholder>` we're popping the top most item off the stack and rendering it in place of the actual placeholder. By using recursive components we've found a way to nest components that were rendered in parallel.

Eventually the stack will run out of items and there will be nothing left to render. We'll add a terminating condition to `<StackReader>` to handle that case:

```jsx
import { createContext } from "react";

export const StackContext = createContext([]);

function StackReader({ stack }) {
  const [first, ...rest] = stack;

  return rest.length > 0 ? (
    <StackContext value={rest}>{first}</StackContext>
  ) : (
    first
  );
}
```

And that's it! We've found a way to render RSC routes in parallel on the server, and then stitch them back together recursively on the client. Since all routes run at the same time, this tree won't waterfall.

{% demo4 /%}

## Implementation details

One of the great things about this pattern is that it's completely hidden from the developer and only an implementation detail of the router. While this approach is certainly complex, it's something that you rarely have to think about when building an RSC app. If the framework you're using finds a better way to render routes then that's something that can be changed under the hood without affecting the app.

In fact, instead of using a stack based approach like we did in this post, you could imagine a router using an n-ary tree instead. That way you could render not just a single hierarchy of routes, but an entire website in one pass. Admittedly this idea is somewhat unusual, but it's fun to think about the different approaches that could be taken with server and client route rendering.

I hope you enjoyed this post and it gave you a little more insight into what happens under the hood of an RSC router. Thanks for reading!
