---
# publishedAt: "2026-02-08T08:00:00Z"
description: "A deep dive into how errors flow through an RSC application."
---

# RSC Error Handling

Today we're going to explore error handling in RSC. Although this post is mostly look under the hood at how an RSC framework handles errors, it will shed some light on React's error handling and control flow when it comes to RSC applications.

In this post we'll look at:

- How thrown exceptions make their way from RSCs to error messages that appear on the user's screens.
- How Suspense and streaming affect errors.
- Errors in server actions.
- Production vs Development
- How errors can be used for control flow with RSCs.
- Errors outside of React

To get started, let's unpack how a thrown exception makes its way from an RSC to an error message displayed in a user's browser.

## The three environments

Typically RSC applications are going to consist of three environments in which they render. Each of these environments has it's own rules and handles errors differently from the others.

- **The RSC render**: This is the process responsible for rendering and executing React Server Components. When an error is thrown during the RSC render then the component tree is replaced by that error. The error itself is serialized right into the RSC stream.

- **The SSR render**: This is the server process responsible for turning an RSC stream and its client components into HTML. When an error is thrown during SSR one of two things happens:
  - If streaming and the error is inside a `<Suspense>` boundary, then the SSR process cancels rendering everything inside the boundary and allows the client (browser) to reattempt the render.
  - Otherwise the SSR process throws and exits.

- **The Browser render**: This is client-side React render that is most familiar for front-end developers. If an error is thrown here then React will allow the closest `ErrorBoundary` to catch the error and display a friendly fallback. This is the only environment where React's Error Boundaries work, and it's likely the best place for the error to be caught and displayed to the user.

If you're like me, then understanding all of that was probably difficult. Holding how each of these environments interacts with errors, when and where `<Suspense>` boundaries affect errors, and how to properly handle errors can feel a bit overwhelming.

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

The next rendering environment we'll look at is the SSR render. This environment is responsible for taking an RSC stream, along with a bundle of client components, and producing HTML that can be served to a browser when it initially visits a website.

This environment relies on the `renderToReadableStream` API from the `react-dom/server` package.

Let's see what happens when we try to render the stream containing the error from above.

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

const htmlStream = await renderToReadableStream(<App tree={tree} />);
```

As soon as we try to turn the RSC stream into HTML we are met with a catastrophic error:

```text
TODO: need to recreate this error in a prestine environment
```

The reason for the crash is because there's no way to turn a serialized error into HTML. Conceptually, when React DOM's `renderToReadableStream` encounters an RSC stream with an error it's the same as rendering a component that throws an error. However, since Error Boundaries do not work in the SSR environment there is no way for the render to handle this error, so instead it crashes.

In this case, we'll use a `try-catch` statement to handle this error. Add footnote here about Suspense changing things

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
  return new Response(`Unable to generate SSR stream`, {
    status: 500,
  });
}
```

Now responding with an _Unable to generate SSR stream_ isn't the most helpful message in the world, but since we cannot render the RSC stream there is not much the SSR render can do in this state.

I've found that the best thing to do in this situation is to let the RSC stream attempt to render one more time, but this time in the browser instead of on the server. The reason being that the browser's rendering environment has better options for handling errors.

### Errors during the Browser render

The browser render is similar to the SSR render in that it takes an RSC stream that was created on the server and attempts to render it. However, React supports `ErrorBoundaries` in the browser environment, which means we have a way to handle streams containing an error.

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

        <RSCStreamCrashBoundary>
          <div>{tree}</div>
        </RSCStreamCrashBoundary>
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

So far in this post we've only looked at a single server component that does nothing but throw an error. However, real-world RSC apps are more complicated and often contain streaming Suspense boundaries.

Let's take a look at what happens when we render an RSC stream that doesn't error until after a second.

```jsx
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
```

For the first second the stream output looks normal, we see the component tree serialized as JSX and our Suspense boundary:

```json
5:"$Sreact.suspense"
:N1770572629223.7134
1:{"name":"MyTree","key":null,"env":"Server","stack":[["main","/Users/ryan/projects/rsc-render/dist/index.js",9141,109,9140,1,false],["Object.<anonymous>","/Users/ryan/projects/rsc-render/dist/index.js",9148,1,1,1,false]],"props":{}}
2:[["MyTree","/Users/ryan/projects/rsc-render/dist/index.js",9131,54,9130,1,false]]
3:[["MyTree","/Users/ryan/projects/rsc-render/dist/index.js",9132,48,9130,1,false]]
4:[["MyTree","/Users/ryan/projects/rsc-render/dist/index.js",9133,48,9130,1,false]]
6:[["MyTree","/Users/ryan/projects/rsc-render/dist/index.js",9133,128,9130,1,false]]
8:{"name":"Throws","key":null,"env":"Server","owner":"$1","stack":[["MyTree","/Users/ryan/projects/rsc-render/dist/index.js",9133,216,9130,1,false]],"props":{}}
0:D{"time":12.879458999999997}
0:D"$1"
0:D{"time":13.199209}
7:D{"time":13.54075}
7:D"$8"
0:["$","div",null,{"children":[["$","p",null,{"children":"Hello from RSC!"},"$1","$3",1],["$","$5",null,{"falllback":["$","p",null,{"children":"Loading..."},"$1","$6",0],"children":"$L7"},"$1","$4",1]]},"$1","$2",1]

Error: Whoops (after 1 second)!
    at Throws (/Users/ryan/projects/rsc-render/dist/index.js:9138:9)
a:[["Throws","/Users/ryan/projects/rsc-render/dist/index.js",9137,9,9136,1,false]]
9:J{"name":"Throws","start":13.599124999999997,"end":1014.6703339999999,"env":"Server","stack":"$a","owner":"$8","value":"$@b"}
c:[["Throws","/Users/ryan/projects/rsc-render/dist/index.js",9137,9,9136,1,false]]
b:"$undefined"
7:D{"time":13.678334}
7:D{"awaited":"$9","env":"Server","owner":"$8","stack":"$c"}
7:D{"time":1014.8267089999999}
7:D{"time":1018.2565419999999}
7:E{"digest":"","name":"Error","message":"Whoops (after 1 second)!","stack":[["Throws","/Users/ryan/projects/rsc-render/dist/index.js",9138,9,0,0,false]],"env":"Server","owner":"$8"}

```

However, after a second the `<Throws>` component renders and our stream captures its error. From our streams point of view there's no crash, instead it's just a stream of JSX follow by a thrown error.

So we're left with a stream that works for the first second, and then crashes. What happens when we try to render this stream?

### Suspense, SSR, and Errors

In the SSR environment React will start outputting HTML as soon as it as the RSC stream produces a chunk that can be turned into HTML: Note this needs to be reworded.

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

const htmlStream = await renderToReadableStream(<App tree={tree} />);
```
