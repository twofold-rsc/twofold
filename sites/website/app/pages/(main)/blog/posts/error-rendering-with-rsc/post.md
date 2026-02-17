---
publishedAt: "2026-02-17T08:00:00Z"
description: "How errors thrown in React Server Components flow through an application."
---

# Error rendering with RSC

Today we're going to take a look at what happens when a React Server Component throws an error during render. Although this post is mostly look under the hood at how an RSC framework handles errors, it will shed some light on React's error handling when it comes to RSC applications.

In this post we'll look at:

- How React's different rendering environments respond to errors.
- How thrown exceptions make their way from RSCs to error messages displayed on the user's screen.
- How Suspense and streaming affect errors.

To get started, let's dive into how each of React's rendering environments handle errors.

## The three environments

Typically RSC applications are going to consist of three environments in which they render. Each of these environments has it's own rules and handles errors differently from the others.

{% rendering-environments /%}

- **The RSC render**: This is the process responsible for rendering and executing React Server Components. When an error is thrown during the RSC render then the component tree is replaced by that error. The error does not causing rendering to crash, but instead it gets turned into data and is serialized right into the RSC stream.

- **The SSR render**: This is the server process responsible for turning an RSC stream and its client components into HTML. When an error is thrown during SSR one of two things happens:
  - If streaming and the error is inside a `<Suspense>` boundary, then the SSR process cancels rendering everything inside the boundary and allows the client (browser) to reattempt the render.
  - Otherwise the SSR process throws and exits.

- **The Browser render**: This is client-side React render that is most familiar for front-end developers. If an error is thrown here then React will allow the closest `ErrorBoundary` to catch the error and display a friendly fallback. This is the only environment where React's Error Boundaries work, and is the best place for the error to be caught and displayed to the user.

To break it down, let's take a deeper look at each of these environments, and understand how errors make their way from the RSC render all the way to an error message that shows up on the users screen.

### Errors in the RSC Render

Rendering RSCs is done through a bundler specific implementation of the `renderToReadableStream` API. We'll use the `react-server-dom-webpack` package to show what happens when rendering an RSC that errors.

```jsx
import { renderToReadableStream } from "react-server-dom-webpack/server";

function MyComponent() {
  throw new Error("Whoops!");
}

const rscStream = await renderToReadableStream(<MyComponent />, {});
```

Although `<MyComponent>` can never successfully render, the above code works perfectly fine. Instead of rendering a component, the stream is created with a serialized error inside it.

In fact, if we peek inside the stream we'll see the thrown error:

```json
0:E{"digest":"","name":"Error","message":"Whoops!","stack":[["MyComponent","/index.js",9130,9,0,0,false]],"env":"Server","owner":null}
```

This is why throwing an error in an RSC environment doesn't cause `renderToRedableStream` to fail. React is able to catch the error and serialize it right into the RSC stream.

Although we have successfully created an stream, we don't know what will happen when the stream is handed off to a client for rendering.

### Errors during the SSR Render

The next rendering environment we'll look at is the SSR render. This environment is responsible for taking an RSC stream and producing HTML that can be served to a browser when it initially visits the application.

This environment relies on the `renderToReadableStream` API from the `react-dom/server` package.

Let's see what happens when we try to render the RSC stream containing the error from above.

```jsx
// The RSC environment creates a stream with an error

import { renderToReadableStream } from "react-server-dom-webpack/server";

function MyComponent() {
  throw new Error("Whoops!");
}

const rscStream = await renderToReadableStream(<MyComponent />, {});

// [!client-boundary]

// And now the SSR client environment tries to render that stream

import { createFromReadableStream } from "react-server-dom-webpack/client";
import { renderToReadableStream } from "react-dom/server";

function App({ tree }) {
  return (
    <html>
      <body>
        <p>Here is the React Server Component render turned into HTML:</p>
        <div>{tree}</div>
      </body>
    </html>
  );
}

const tree = await createFromReadableStream(rscStream);

try {
  const htmlStream = await renderToReadableStream(<App tree={tree} />);
  return new Response(htmlStream);
} catch (e) {
  console.log("Unable to render HTML...");
  console.log(error);
}
```

As soon as we try to turn the RSC stream into HTML we are met with a catastrophic error:

```text
Unable to render HTML...

Error: Whoops!
    at MyComponent (about://React/Server/file:///index.js)
    ...
  environmentName: 'Server',
  digest: ''
}
```

React is unable to turn the `rscStream` into HTML. The `renderToReadableStream` function from `react-dom/server` throws and we're left with a rejected promise that contains the original _Whoops_ error from the RSC stream.

This is the point where the RSC error materializes into an actual error that our code has to handle. Conceptually, when React DOM's `renderToReadableStream` encounters an RSC stream with an error it's the same as rendering a component that throws an error.

Normally, we would use a React Error Boundary to handle components that throw errors during render. However, since error boundaries do not work in the SSR environment the only option for our code here is to crash.

So in this case, we'll need to have the `try-catch` statement respond with something when handle this error.

```jsx
import { createFromReadableStream } from "react-server-dom-webpack/client";
import { renderToReadableStream } from "react-dom/server";

function App({ tree }) {
  return (
    <html>
      <body>
        <p>Here is the React Server Component render turned into HTML:</p>
        <div>{tree}</div>
      </body>
    </html>
  );
}

const tree = await createFromReadableStream(rscStream);

try {
  const htmlStream = await renderToReadableStream(<App tree={tree} />);
  return new Response(htmlSream);
} catch (err) {
  return new Response(`Unable to generate SSR response`, {
    status: 500,
  });
}
```

Now responding with an _Unable to generate SSR response_ isn't the most helpful message in the world, but since we cannot render the RSC stream there is not much left for the SSR render can do in this state.

I've found that the best thing to do in this situation is to let the RSC stream attempt to render one more time, but this time in the browser instead of on the server. The reason being that the browser's rendering environment has better options for handling errors.

### Errors during the Browser render

The browser render is similar to the SSR render in that it takes an RSC stream that was created on the server and attempts to render it. However, since React supports Error Boundaries in the browser environment we have a way to handle RSC streams that contain errors.

TODO: Add tabs with an error boundary

```jsx
// The RSC environment creates a stream with an error

import { renderToReadableStream } from "react-server-dom-webpack/server";

function MyComponent() {
  throw new Error("Whoops!");
}

app.get("/rsc-stream", async () => {
  const rscStream = await renderToReadableStream(<MyComponent />, {});
  return new Response(rscStream);
});

// [!client-boundary]

// And now the browser environment tries to fetch and render that stream

import { createFromFetch } from "react-server-dom-webpack/client";
import { createRoot } from "react-dom/client";
import { RSCStreamCrashBoundary } from "./rsc-stream-crash-boundary";

function App({ tree }) {
  return (
    <html>
      <body>
        <p>Here is the React Server Component render turned into HTML:</p>

        <RSCStreamErrorBoundary>
          <div>{tree}</div>
        </RSCStreamErrorBoundary>
      </body>
    </html>
  );
}

const root = createRoot(document);

const response = fetch("/rsc-stream");
const tree = await createFromFetch(response);

root.render(<App tree={tree} />);
```

In the above example we fetch the RSC stream from an HTTP endpoint on our server and then attempt to render it using React's browser APIs. Since the stream contains an error React will throw during render and the `<RSCStreamCrashBoundary>` component will catch the error and display a friendly message.

```text
TODO: Demo to try it out
```

The browser environment is the only rendering environment that supports Error Boundaries. This mean that whenever an Error happens during an RSC render our job is to get it over the browser as quickly as possible so that a message can be displayed to the user.

## How Suspense changes errors

So far in this post we've only looked at a single server component that does nothing but throw an error. Real-world RSC applications are much more complicated and are often filled with streaming Suspense boundaries.

Let's take a look at what happens when we render an RSC stream that doesn't error until after a second.

```jsx
import { renderToReadableStream } from "react-server-dom-webpack/server";

function MyTree() {
  return (
    <div>
      <p>Hello from RSC!</p>

      <Suspense fallback={<p>Loading...</p>}>
        <Throws />
      </Suspense>
    </div>
  );
}

async function Throws() {
  await new Promise((r) => setTimeout(r, 1000));

  throw new Error("Whoops (after 1 second)!");
}

const rscStream = await renderToReadableStream(<MyTree />, {});
```

For the first second the stream output looks normal, we see the serialized component tree and Suspense boundary:

```json
1:"$Sreact.suspense"
0:["$","div",null,{"children":[["$","p",null,{"children":"Hello from RSC!"}],["$","$1",null,{"fallback":["$","p",null,{"children":"Loading..."}],"children":"$L2"}]]}]

// one second later...

2:E{"digest":"","name":"Error","message":"Whoops (after 1 second)!","stack":[["Throws","/index.js",9138,9,0,0,false]]}
```

But then after a second the `<Throws>` component renders and our stream captures its error. From our streams point of view there's no crash, instead it's just a stream of JSX followed by a thrown error.

So we're left with a stream that works for the first second, and then crashes. What happens when we try to render this stream in an SSR environment?

### Suspense, SSR, and Errors

In the SSR environment React will start producing HTML as soon as it has anything it can render. Since the tree now contains a Suspense boundary with text that says _Loading..._, React can use that to render HTML before the `<Throws />` component finishes running.

```jsx
// The RSC environment creates a stream with an error

import { renderToReadableStream } from "react-server-dom-webpack/server";

function MyTree() {
  return (
    <div>
      <p>Hello from RSC!</p>

      <Suspense falllback={<p>Loading...</p>}>
        <Throws />
      </Suspense>
    </div>
  );
}

async function Throws() {
  await new Promise((r) => setTimeout(r, 1000));

  throw new Error("Whoops (after 1 second)!");
}

const rscStream = await renderToReadableStream(<MyTree />, {});

// [!client-boundary]

// And now the SSR client environment tries to render that stream

import { createFromReadableStream } from "react-server-dom-webpack/client";
import { renderToReadableStream } from "react-dom/server";

function App({ tree }) {
  return (
    <html>
      <body>
        <p>Here is the React Server Component render turned into HTML:</p>
        <div>{tree}</div>
      </body>
    </html>
  );
}

const tree = await createFromReadableStream(rscStream);

try {
  const htmlStream = await renderToReadableStream(<App tree={tree} />);
  return new Response(htmlStream);
} catch (e) {
  console.log("Unable to render HTML...");
  console.log(error);
}
```

When the code above is rendered something interesting happens:

```html
<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <p>Here is the React Server Component render turned into HTML:</p>
    <div>
      <div>
        <p>Hello from RSC!</p>
        <!--$?-->
        <template id="B:0"></template>
        <p>Loading...</p>
        <!--/$-->
      </div>
    </div>

    <!-- A one second pause here... -->

    <script>
      $RX = function (b, c, d, e, f) {
        var a = document.getElementById(b);
        a &&
          ((b = a.previousSibling),
          (b.data = "$!"),
          (a = a.dataset),
          c && (a.dgst = c),
          d && (a.msg = d),
          e && (a.stck = e),
          f && (a.cstck = f),
          b._reactRetry && b._reactRetry());
      };

      $RX(
        "B:0",
        "",
        `
        Switched to client rendering because the server rendering errored:
        Whoops (after 1 second)!`,
        `
        Switched to client rendering because the server rendering errored:

        Error: Whoops (after 1 second)!
          at Throws (about://React/Server/file:////index.js?9:9138:9)
          ...
        `,
      );
    </script>
  </body>
</html>
```

We can see that React is able to successfully produce HTML for this RSC stream! In fact we see the Suspense boundary, with ID `B:0`, renders its _Loading..._ fallback message.

Then after one second something interesting happens. The `<Throws />` component throws its error and now there is nothing for React to fill in the `B:0` Suspense boundary with. So instead React leaves the fallback rendered and displays a message that says: _Switched to client rendering because the server rendering errored_.

And this is how Suspense boundaries affect errors in the SSR environment. Once the SSR server has started generating HTML any errors that happen inside Suspense boundaries will cause those boundaries to remaining in their fallback state. In a way, React has given up on rendering this part of the tree on the server.

React cannot throw an error, because it's already produced HTML output from the non-suspended parts of the tree, but it also cannot render a component that's errors. So the next best thing for React to do here is to leave this tree untouched and let the browser attempt to render it.

When the browser attempts to render the RSC stream it will produce the Suspense boundary with a _Loading..._ just like the server. However, when the error from the `<Throws />` component renders in the browser, React is able to let the closest Error Boundary catch and handle the error. If there are no Error Boundaries to handle the error then the application crashes and unrenders itself.

## Errors across the environments

Handling RSC errors during render is tricky because each environment treats errors differently from the others.

- In the RSC environment errors are treated as data and serialized into the RSC stream. They do not cause the RSC render to crash.
- In the SSR environment errors will crash the render if they happen outside of a Suspense boundary. Inside of a Suspense boundary, errors cause the fallback to remain rendered and React stops rendering the suspended part of the tree.
- In the Browser environment errors will trigger the nearest Error Boundary. This is what allows the application can show a helpful error message to users.

My biggest take away from implementing errors inside an RSC framework is that an error needs to make it's way to the browser as quickly as possible, since that's the only environment that can realistically use React to show an error message to the user. When errors happen in RSC or SSR there needs to be a clear path for rendering them in the browser.

Hopefully this article shed some light on how errors flow through React's different rendering environments.

I plan on writing a few more posts on error handling that cover errors inside of server actions, how RSCs can log errors, and using RSC errors for control flow in React. If there's anything about RSC error handling that you'd like to know more about please do not hesitate to reach out.

As always, thanks for reading.
