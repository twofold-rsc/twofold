---
publishedAt: "2025-09-08T08:00:00Z"
description: "todo"
---

# Recursive and parallel route rendering with RSC

RSC routers are tricky to understand. If you're coming from a traditional React background there are a number of patterns used by these routers that will surprise you. But these routers have solutions that solve very thorny issues like data-fetching waterfalls by rendering in parallel.

I recently had the opportunity to add recursive route rendering to [Twofold]() and I think the pattern is so interesting that I wanted to share it here.

But in order to understand RSC route rendering, we need to touch on a wide range of seemingly unrelated topics:

- RSC trees with Layouts and Pages
- Data-fetching and waterfalls
- React's two-phase rendering
- Serialization
- Parallel rendering
- Recursive components

These concepts all come together to create one of the most interesting RSC patterns I've had to joy to work with: The Recursive and Parallel Router.

If you've ever wanted to peek under the hood of how an RSC route rendering works and how it avoids waterfalls, then this post is for you.

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

- `<RootLayout>` fetches the current user and displays their name in the header.
- `<PostsLayout>` fetches a list of all the posts and displays them in a sidebar.
- `<EditPage>` fetches the post being edited and displays it in the main content area.

And this is why we love React Server Components, we get to co-locate the data fetches right inside of the components that need the data.

But there's a problem, this combination of nested components and data-fetching means that our app waterfalls.

If you haven't heard the term before, a waterfall is when a parent component fetches data and then renders a child component. That child component then fetches its own data, and then renders its own child component.

This is a problem because child components cannot begin fetching their data until their parents have finished fetching and rendering. In a waterfall tree, every child is blocked by it's parent. Ultimately, this leads to a series of sequential data-fetches and poor response times.

\[ demo 2, waterfall timeline \]

The term waterfall comes from the way these components appear on a rendering timeline. Since no component can render before it's parent finishes, it paints a picture that sort of looks like a waterfall.

To show you how this affects the user experience of your app I've changed each data-fetch to take 1 second to load. Try refreshing the app, see how the components load one after the other.

{% demo3 /%}

Ouch. That's tough to watch.

An app that waterfalls has poor render performance because the total time to render is the sum of _all_ the rendering times of all components. In our case, this app is not usable for 3 seconds.

In order to fix the waterfalls, we need a router that runs each of these components in parallel.

## Parallel rendering

Most of the time when we think of rendering React Server Components we think of rendering trees of components on the server.

For example, here's a server rendered tree of three components all nested together:

```jsx
async function ComponentA() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>Component A</div>;
}

async function ComponentB() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>Component B</div>;
}

function ComponentC() {
  return <div>Component C</div>;
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

\[ Try it \]

The output from rendering with `renderToReableStream` is a serialized format that RSC uses to represent data that was server rendered.

You can see that this render also waterfalls because of the awaits in `<ComponentA>` and `<ComponentB>`.

However, `renderToReadableStream` isn't limited to rendering only React components. It can render a wide variety of data types including arrays and objects.

```jsx
const stream = renderToReableStream(
  {
    hello: "world",
    object: { a: 1, b: 2 },
    list: [1, 2, 3],
  },
  clientModuleMap,
);
```

It wasn't obvious to me at first, but this ability to render data structures is the key to parallel rendering.

Instead of rendering a tree of components, we can render a list of components:

```jsx
async function ComponentA() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>Component A</div>;
}

async function ComponentB() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>Component B</div>;
}

function ComponentC() {
  return <div>Component C</div>;
}

const stream = renderToReableStream(
  [<ComponentA />, <ComponentB />, <ComponentC />],
  clientModuleMap,
);
```

\[ Try it \]

Since `<ComponentA>`, `<ComponentB>`, and `<ComponentC>` are no longer nested, they all start rendering at the same time. The awaits in the first two components no longer block `<ComponentC>` from rendering.

We've sidestepped the waterfall by rendering a list of components instead of nested React tree.

Does this mean that we can fix our blog post editor by rendering a list of components instead of a React tree?

```jsx
const stream = renderToReableStream(
  [<RootLayout />, <PostsLayout />, <EditPage postId={123} />],
  clientModuleMap,
);
```

Not quite. The `<RootLayout />` and the `<PostsLayout />` both expect `children` in order to render correctly. If we render the components in a list like this the layouts will break.

We've got a way to render components in parallel, but we don't yet have a way to nest them. Luckily we can take advantage of React's two-phase rendering to solve this.

## Two-phase rendering

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

If you squint at the data the server is rendering, it looks just like a stack. The top most item in the stack is the `RootLayout`, followed by the `PostsLayout`, and then finally the `EditPage`.

When we call `renderToReadableStream` it runs all the server components, create a stack-like data structure, and then serialize that output in a stream. It's important to know that `renderToReadableStream` only runs server components, it leaves all client components untouched.

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

This is the first phase of rendering. All server components have been executed, but client components have not yet run. {% footnote id="1" %}The example above is just a representation of the output from renderToReadableStream. In reality, the output is a [ReadableStream]() that contains a text-based wire format. This wire format isn't readable for humans, so I didn't want to show it here. However, the wire format is similar to the example above in that it contains rendered server components and unrendered references to client components.{% /footnote %}

The key point here is that `renderToReadableStream` has rendered all the server components, but left the client components (like `<Placeholder>`) untouched.

If you look at that the imagined output above, you'll see each layout renders a placeholder where it's children should be. What's so interesting about this is that the actual children are the very next item in the stack.

In fact, you could imagine `<Placeholder />` being a component that simply pulls in and renders the next item in the stack. In otherwords, `<Placeholder />` is a literal placeholder for what's rendered next.

This is how we're going to turn these parallel rendered server components back into a nested tree. We'll use recursive React components to have `<Placeholder />` pull in the real children.

## Recursive components

This is the first phase of rendering. It executes all RSCs and serializes the output into a stream.

If we want to turn the serialized output back into a real and tangible stack data structure then we need to use the `createFromReadableStream` function, which is available to React clients.

```jsx
// on the server
const stream = renderToReadableStream(...);

// [!client-boundary]

// and then later on the client
const stack = await createFromReadableStream(stream);

console.log(stack);
```

// => [
// /* RootLayout with Placeholder child */
// <html>
// <body>
// <Placeholder />
// </body>
// </html>,
// <PostsLayout>
// <Placeholder />
// </PostsLayout>,
// <EditPage />
// ]

You can think of `createFromReadableStream` as the opposite of `renderToReadableStream`. It takes the serialized RSC data and turns it back into a real tangible data structure.

Typically your server will use `renderToReadableStream` to execute and serialize the output from RSCs. Then your client will use `createFromReadableStream` to turn those payloads into renderable React elements.

```jsx
// on the server

const stream = renderToReadableStream(...);

// [!client-boundary]

// and then later on the client

const stack = await createFromReadableStream(stream);

console.log(stack);
// => [
//      <RootLayout>
//        <Placeholder />
//      </RootLayout>,
//      <PostsLayout>
//        <Placeholder />
//      </PostsLayout>,
//      <EditPage />
//    ]
```

When you run `renderToReadableStream` React will render all server components, but leave client components unrendered. This is the first phase of rendering.

When you use `createFromReadableStream` React will recreate the serialized data structure into something that. This is the second phase of rendering.

on the server it produces a stream of serialized data. When you run `createFromReadableStream` on the client it consumes that stream and produces a real JavaScript data structure.

You can think of `renderToReadableStream` as the first phase of rendering and `createFromReadableStream` as the second phase of rendering.

## R

We can recreate this stack on the client and then feed it into React component we conveniently named `<StackReader>`

```jsx
const res = await fetch("/endpoint-that-renders-stack");

const stack = await createFromReadableStream(res.body);

<StackReader stack={stack} />;
```

Here's the `StackReader` component:

```jsx
import { createContext } from "react";

export const StackContext = createContext([]);

function StackReader({ stack }) {
  const [first, ...rest] = stack;
  return <StackContext stack={rest}>{first}</StackContext>;
}
```

This component pops the first item off the stack and renders it. In our example that's the `RootLayout` and it's `<Placerholder>` child. It then takes the rest of the stack and puts those items into a context.

Now for the recursive bit, we can change the `Placeholder` component to start the whole process all over again. It'll render the `StackReader` component, which pops the next item off the stack and renders it.

```jsx
"use client";

import { StackContext } from "./stack-reader";

export function Placeholder() {
  const stack = useContext(StackContext);

  return <StackReader stack={stack} />;
}
```

Every time we render a placeholder we're popping the top most item off the stack and rendering it in place of the actual placeholder. By using recursive components we've found a way to nest our components that were rendered in parallel.

Visually, it looks like a stack that recursively pops itself into a tree structure.

\[ demo 11, animated placeholder \]

Eventually the stack will run out of items and there will be nothing left to render. We'll add a terminating condition to `StackReader` to handle that case:

```jsx
import { createContext } from "react";

export const StackContext = createContext([]);

function StackReader({ stack }) {
  const [first, ...rest] = stack;

  return rest.length > 0 ? (
    <StackContext stack={rest}>{first}</StackContext>
  ) : (
    first
  );
}
```

And that's it! We've built a route renderer in React that is able to run all the routes in parallel and then recreate the routing tree using recursion. Since all routes run at the same time, this tree won't waterfall.
