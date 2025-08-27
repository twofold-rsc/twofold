# RSC Routers are recursive and parallel

# How RSC Routers use recursion to render in parallel

RSC routers are tricky to understand. If you're coming from a traditional React background there are a number of patterns used by these routers that will surprise you. But these routers have solutions that solve very thorny issues like data-fetching waterfalls by rendering in parallel.

I recently had the opportunity to add recursive routing to [Twofold]() and I think the pattern is so interesting that I wanted to share it here.

But in order to understand RSC routers, we need to touch on a wide range of seemingly unrelated topics:

- RSC trees with Layouts and Pages
- Data-fetching and waterfalls
- React's two-phase rendering
- Parallel rendering
- Recursive components

These concepts all come together to create one of the most interesting RSC patterns I've had to joy to work with: The Recursive Parallel Router.

If you've ever wanted to peek under the hood of how an RSC router works and how it avoids waterfalls, then this post is for you.

## Waterfalls

Before we begin, we need to talk about one of the biggest problems that RSC routers have to solve: Waterfalls.

To explain, here's a React app that's an admin area for a blog post editor.

```jsx
import RootLayout form "./root-layout";
import PostsLayout from "./posts-layout";
import EditPage from "./edit-page";

export functin App() {
  return (
    <RootLayout>
      <PostsLayout>
        <EditPage postId={123} />
      </PostsLayout>
    </RootLayout>
  )
}
```

And here's the app rendered. You can click around and edit different posts.

\[ demo 1 \]

This app is made up of three different components: `RootLayout`, `PostsLayout`, and `PostEditPage`.

And each of these components fetches it's own data:

- `<RootLayout>` fetches the current user and displays them in the header.
- `<PostsLayout>` fetches a list of all the posts and displays them in a sidebar.
- `<EditPage>` fetches the post being edited and displays it in the main content area.

This combination of nested components and data-fetching means that our app waterfalls.

If you haven't heard the term before, a waterfall is when a parent component fetches data and then renders a child component. That child component then fetches its own data, and then renders its own child component. The more components in the tree that do this, the bigger the waterfall becomes.

This is a problem because child components do not begin fetching their data until their parents have finished fetching and rendering. Every child is blocked by it's parent, even if the parent and child fetch unrelated and non-dependant data. Ultimately, this leads to a series of sequential data-fetches and poor response times.

The term waterfall comes from the way these components appear on a rendering timeline. Since no component can render before it's parent finishes, it paints a picture that sort of looks like a waterfall.

\[ demo 2, waterfall timeline \]

To show this to you I've changed the app to have each data-fetch takes 1 second to load. Try refreshing the app, see how the components load one after the other.

\[ demo 3, arrow this app waterfalls \]

An app the waterfalls has poor render performance because the total time to render is the sum of _all_ the rendering times of all components. In our case, this app is not usable for 3 seconds.

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

\[ demo 6, try it out \]

The output of `renderToReadableStream` is a stream that emits a JSON-like payload. Take a look at the output, you'll notice two interesting bits of data: The server time and an un-rendered client component:

\[ demo 7, highlighted flight data \]

This is the first phase rendered. It's a React tree with only the server component executed.

What's great about this output is that it's entirely serializable. Right now we're looking at text, which means we can easily send it over an HTTP response for a client to render.

And that's exactly what we'll do next.

### Phase 2: Client render

In this phase, we'll continue rendering and execute the `<ClientCounter />` component. React ships with a counterpart to `renderToReadableStream` called `createFromReadableStream`:

```js
import { createRoot } from "react-dom/client";

const res = await fetch("/endpoint-that-returns-rsc");

const tree = await createFromReadableStream(res.body);

root.createElement(document.getElementById("root"));
root.render(tree);
```

Here we fetch the stream created during phase 1 and render it in the browser using `react-dom`. This render loads and executes all the client components that were left un-rendered by the server.

\[ demo 8, server time with client counter \]

The result is a React app that was partially rendered on the server and partially rendered on the client. Pretty cool!

It's not obvious, it certainly wasn't too me, but this two-phase rendering is the key to running pages and layouts in parallel.

## Parallel route rendering
