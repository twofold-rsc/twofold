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

\[ demo 3, arrow this app waterfalls \]

An app that waterfalls has poor render performance because the total time to render is the sum of _all_ the rendering times of all components. In our case, this app is not usable for 3 seconds.

In order to fix the waterfalls, we need a router that runs each of these components in parallel.

That's certainly doable, but before we can do that we first need to take a detour to understand React's two-phase rendering.

## How RSCs render

React uses a two-phase rendering system for server and client components. First, React renders server components leaving client components untouched. Next, that output is given to a client renderer that executes the client components.

\[ demo 4, try it out - ServerTime and ClientCounter \]

Under the hood, here's how React renders this tree:

\[ demo 5, two phase component flow \]

You need two phases here because these two components run in two distinct environments, client and server. The client cannot know what time it is on the server, and the server cannot bind an `onClick` event handler to a button that re-renders a new count whenever it's pressed.

Improve this: Let's walk through these two render phases with our example tree from above.

### Phase 1: Server render

The first thing we want to do is render the tree on the server, for this, we'll use the `renderToReadableStream` function from React:

```jsx
// import?
// import webpack, called it webpack map

const stream = renderToReableStream(
  <>
    <ServerTime />
    <ClientCounter />
  </>,
  clientModuleMap,
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

\[ demo 6, try it out \]

The output of `renderToReadableStream` is a stream that emits a JSON-like payload. Take a look at the output, you'll notice two interesting bits of data: The server time and an unrendered client component:

\[ demo 7, highlighted flight data \]

This is the first phase rendered. It's a payload with only the server component executed.

What's great about this output is that it's entirely serializable. Right now we're looking at text, which means we can easily send it over an HTTP response for a client to render.

And that's exactly what we'll do next.

### Phase 2: Client render

In this phase, we'll continue rendering by executing the `<ClientCounter />` component. React ships with a counterpart to `renderToReadableStream` called `createFromReadableStream`:

```js
import { createRoot } from "react-dom/client";

const res = await fetch("/endpoint-that-returns-rsc");

const tree = await createFromReadableStream(res.body);

root.createElement(document.getElementById("root"));
root.render(tree);
```

Here we fetch the stream created during phase 1 and render it in the browser using `react-dom`. This render loads and executes all the client components that were left unrendered by the server.

\[ demo 8, server time with client counter \]

The result is a React app that was partially rendered on the server and partially rendered on the client. Pretty cool [Footnote]

Next, we'll explore how RSC can render more than just components.

## Rendering more than components

Let's go back and revisit the server rendering example that uses `renderToReableStream`:

```jsx
// import?

const stream = renderToReableStream(
  <>
    <ServerTime />
    <ClientCounter />
  </>,
, clientModuleMap);

for await (const chunk of stream) {
  console.log(chunk);
}
```

Here we're using it to render our two React components, but this API isn't limited to rendering only components. It can also render a wide variety of data types like objects and arrays.

```jsx
const stream = renderToReableStream(
  {
    string: "hello world",
    list: [1, 2, 3, 4, 5],
    object: { key: "value" },
  },
  clientModuleMap,
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

\[ demo 9, try it out \]

And if we want to recreate this data structure on the client we can do so using `createFromReadableStream`:

```jsx
const res = await fetch("/endpoint-that-returns-rsc");

const data = await createFromReadableStream(res.body);

console.log();
```

That's certainly interesting! React on the server isn't limited to only rendering React trees. From the example above, we can use React to render any object or data structure in a streaming fashion.

Recreate the data structure

Let's keep pushing this, how about a list of React components?

It's not obvious, it certainly wasn't too me, but this two-phase rendering is the key to running pages and layouts in parallel.

## Parallel rendering

```jsx
function ComponentA() {
  return <div>Component A</div>;
}

const stream = renderToReableStream(
  [<ComponentA />, <ComponentB />, <CompooenntC />],
  clientModuleMap,
);
```

\[ demo 10, try it out \]

Yup, that works too! Pretty cool!

What's even cooler is the above example shows Components A, B, and C all being rendered in parallel. That `await` in `<ComponentB />` doesn't slow down or block the rendering of `<ComponentA />` or `<ComponentC />`. All three components start rendering at the same time.

Now, can we use this approach to render our blog post editor components in parallel?

```jsx
const stream = renderToReableStream(
  [<RootLayout />, <PostsLayout />, <EditPage postId={123} />],
  clientModuleMap,
);
```

Not quite. The `<RootLayout />` and the `<PostsLayout />` both expect `children` in order to render correctly.

We've got a way to render components in parallel, but we don't yet have a way to nest them. Luckily for us recursive components exits.

## Recursive components

Let's continue rendering our components in parallel, but this time we'll give the `RootLayout` and `PostsLayout` a placeholder so they have _something_ to use for children.

```jsx
import Placeholder from "./placeholder";

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

The `<Placeholder />` component is just a literal placeholder for now. It renders nothing.

If you squint at the data the server is rendering, it looks just like a stack. The top most item in the stack is the `RootLayout`, followed by the `PostsLayoutx`, and then finally the `EditPage`.

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
