---
lastUpdated: "2025-04-24T08:00:00Z"
description: "Use React to create a promise on the server and later finish it on the client."
---

# You can serialize a promise in React

A neat pattern with React Server Components is to create a promise that starts on the server and later finishes on the client. {% footnote id=1 %}Credit to [@ricky.fm](https://bsky.app/profile/ricky.fm/post/3lmu5erxru22u) for the _"starts on / finishes on"_ phrasing.{% /footnote %}

Here's what it looks like:

```jsx {% file="server-component.js" %}
import { Suspense } from "react";
import { ClientComponent } from "./client-component";

export default function Page() {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve("Hello from the server!"), 2_000);
  });

  return (
    <Suspense
      fallback={<div>Waiting for ClientComponent to read the promise</div>}
    >
      <ClientComponent promise={promise} />
    </Suspense>
  );
}
```

{% demo1 %}

```jsx {% demo=true file="client-component.js" %}
"use client";

import { use } from "react";

export function ClientComponent({ promise }) {
  const message = use(promise);

  return <div>{message}</div>;
}
```

{% /demo1 %}

Promises that cross the network aren't intuitive at first glance. However, understanding how React makes them work will give you insight into the RSC model.

By the end of this post you'll understand how to serialize a promise over the network, as well as the mechanisms used by React Server Components to share data between the server and client.

## Serialization

If you've written a React app in the last few years you've most likely passed data between your backend and frontend. It's easy to do this with JSON:

```js
// Serialize on the server
const person = { name: "Alice", age: 30 };
const json = JSON.stringify(data); // => '{"name":"Alice","age":30}'

// Read on the client
const recreatedPerson = JSON.parse(json); // => { name: "Alice", age: 30 }
console.log(recreateData.name); // => "Alice"
```

JSON is fast, easy to use, and works in every browser, server framework, and programming language.

But if you use JSON to serialize a promise...

```js
const promise = new Promise((resolve) => {
  setTimeout(() => resolve("Hello!"), 1_000);
});

const json = JSON.stringify(promise); // => '{}'
```

The promise gets completely lost. There's just no way to serialize a promise with JSON.

So if we want to share a promise between the server and the client, we need to come up with a new serialization format.

## Creating a new serialization format

In order to serialize a promise, we'll need a format that supports the following:

- The format needs to be able to represent a piece of data that has a future value.
- The format needs to be readable while serialization is on-going. It must be readable while the promise is pending, and readable when the promise resolves.
- The format needs to be sharable across the network.

A clever way to do this is to use a stream. Here's what it looks like:

```js
function serializePromise(promise) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue("promise:create");

      const value = await promise;
      controller.enqueue(`promise:resolve:${value}`);
      controller.close();
    },
  });

  return stream;
}
```

The above `serializePromise` function takes a promise and returns stream.

Here, give it a try:

{% demo2 %}

```js {% demo=true %}
const promise = new Promise((resolve) => {
  setTimeout(() => resolve("Hello!"), 1_500);
});

serializePromise(promise);
```

{% /demo2 %}

The stream is able to represent the promise at each stage of its lifecycle. When the serialize function starts, we put a message into the stream saying `promise:create`. Then when the promise resolves, we put another message in with the value of the promise.

Any reader of the stream can read these messages and know exactly what is going on with the promise.

Finally, one of the amazing features of streams is that they are sharable over the network. In fact, if you've used fetch before, you've used streams.

Any webserver can serve a stream using JavaScript's built-in `Response` object.

```js
new Response(stream);
```

And any browser can read a stream using `fetch`:

```js
const res = await fetch("/api/get-stream");
const stream = res.body; // <- that's the stream!
```

And that's it! Our serialization format is able to represent a promise that's readable when the promise is pending, readable when the promise resolves, and sharable over the network.

## Recreating the promise

Next, we need to get the promise out of the stream and onto the client. To do this, we'll use a new function, `deserializePromise`, that does the opposite of `serializePromise`.

This function takes a stream and recreates a promise from the data in the stream.

```js
function deserializePromise(stream) {
  const reader = stream.getReader();

  let promise;
  let resolver;
  let unlock;

  let didUnlock = false;
  const lockUntilReady = new Promise((resolve) => {
    unlock = (arg) => {
      resolve({ promise: arg });
      didUnlock = true;
    };
  });

  async function readStream() {
    const { done, value } = await reader.read();

    if (done) {
      if (!didUnlock) {
        unlock();
      }
      return;
    }

    if (value === "promise:create") {
      promise = new Promise((resolve) => {
        resolver = resolve;
      });
      unlock(promise);
    } else if (value.startsWith("promise:resolve:")) {
      const result = value.split(":")[2];
      resolver(result);
    }

    readStream();
  }

  readStream();

  return lockUntilReady;
}
```

This code is a bit more involved, but it's not too bad. The key is to read the stream and look for the `promise:create` and `promise:resolve` messages that were sent while the promise was being serialized.

Now a promise can be recreated from the stream using:

{% demo3 %}

```js {% demo=true %}
const promise = new Promise((resolve) => {
  setTimeout(() => resolve("Hello!"), 1_500);
});

console.log("Serializing the promise...");
const stream = serializePromise(promise);
console.log("Done!");

console.log("Recreating the promise...");
const recreated = await deserializePromise(stream);
console.log("Done!");

console.log("Waiting for the promise to resolve...");
const value = await recreated.promise;
console.log("Resolved with:", value);
```

{% /demo3 %}

And just like that, we have a promise that was serialized and deserialized.

One thing to note about `deserializePromise` is the locking mechanism. It makes sure that the function doesn't return until there's a promise ready to use. From there, the rest of the stream processing happens in parallel.

Now while this works, our serialization format is brittle and full of bugs. But luckily for us we can trash all this code and use the stream serialization format that's built into React.

## React 19, RSC, and Serialization

Inside of a react there are two packages, `react-server` and `react-client`. These packages are responsible for serializing and deserializing data between the server and client. Like our toy example, the React packages use a serialization format that is built on top of streams.

These packages are not importable directly by your React app. Instead, they are exposed through bundler specific implementations that your application ends up consuming.

So, let's take a look at how React creates a promise on the server and finishes it on the client.

### On the server

React can serialize a promise using the `renderToReadableStream` API.

{% demo4 %}

```js {% demo=true %}
import { renderToReadableStream } from "react-server-dom-webpack/server";

const promise = new Promise((resolve) => {
  setTimeout(() => resolve("Hello from the server!"), 1_500);
});

const stream = await renderToReadableStream({ promise }, {});

console.log(stream); // => ReadableStream
```

{% /demo4 %}

If you watch the stream you'll see two chunks of data flow through. The first chunk is an object, with a single key, that holds a promise. React uses `$@1` to represent the serialized promise.

The next chunk, appearing 1.5s later, resolves our promise with the value "Hello from the server!".

### On the client

Now moving to the client, we need to read the stream and recreate the promise React serialized on the server. This is done using `createFromReadableStream`.

{% demo5 %}

```js {% demo=true %}
import { createFromReadableStream } from "react-server-dom-webpack/client";

const { promise } = await createFromReadableStream(stream);

const value = await promise;

console.log(value); // => "Hello from the server!"
```

{% /demo5 %}

This function takes a stream and returns whatever was serialized inside of it, in our case an object holding a promise.

These are the two APIs React uses to two pass data between the server and client. This is what allows React to pass promises across the network.

In reality, your app will never directly call these APIs. Instead, the framework you're using will rely on them under the hood.

## React 19 can serialize just about anything

So far we've only looked at a single promise, but it turns out React's serialization format can serialize over 20 different types of data.

This includes:

- Primitives like strings, numbers, booleans, arrays, and objects.
- Non-primitives like dates, sets, maps, and errors.
- React specific types like elements and references.
- Things you wouldn't expect to be serializable like promises, async iterators, and even streams.

That's a pretty impressive list of types that can be serialized and deserialized by React.

And this ability is one of the key features of React Server Components. It allows developers like us to create components that run on the server and seamlessly pass data as props to components on the client.

Moving from server to client is as easy as creating a new component in React. It's composition on a whole new level.

Thanks for reading! I love talking about React and RSC. If you have any questions or comments please reach out to me on [Twitter](https://x.com/ryantotweets) or [Bluesky](https://bsky.app/profile/ryantoron.to).
