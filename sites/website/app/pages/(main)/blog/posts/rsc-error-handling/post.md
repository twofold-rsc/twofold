---
# publishedAt: "2026-02-08T08:00:00Z"
description: "A deep dive into how errors flow through an RSC application."
---

# RSC Error Handling

Today we're going to explore error handling in RSC. Although this post is mostly look under the hood at how an RSC framework handles errors, it will shed some light on React's error handling and control flow when it comes to RSC applications.

In this post we'll look at:

- How thrown exceptions make their way from RSCs to error messages that appear on the user's screens.
- How Suspense and streaming affects errors.
- Errors in server actions.
- How errors can be used for control flow with RSCs.

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

### Errors in the SSR Render

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
need to recreate this error in a prestine environment
```

The reason for the crash is because there's no way to turn a serialized error into HTML. Conceptually, when React DOM's `renderToReadableStream` encounters an RSC stream with an error it's the same as rendering a component that throws an error. Since Error Boundaries do not work in the SSR environment then there is no way for the render to handle this error, so instead it crashes.

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

Now admittedly responding with an _Unable to generate SSR stream_ isn't the most helpful message in the world, but since we cannot render the RSC stream there is not much the SSR render can do in this state.

I've found that the best thing to do in this situation is to let the RSC stream attempt to render one more time, but this time in the browser instead of on the server. The reason being that the browser's render environment has better options for handling errors.

### The Browser render
