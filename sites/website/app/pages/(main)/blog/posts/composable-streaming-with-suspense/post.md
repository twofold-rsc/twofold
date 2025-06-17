---
lastUpdated: "2025-06-16T08:00:00Z"
description: "A look at two real-world UIs that rely on streaming with Suspense."
---

# Composable streaming with Suspense

Streaming with React's `<Suspense>` is one of the most underrated ways to build responsive, data-fetching components. In this post, we’ll look at how Suspense improves the user experience of data-dependent UIs and how easily it composes with the existing UI libraries you already have in your app.

Let's get started with this code that uses `<Suspense>` to stream down sixteen components instances from the server to the client:

{% demo1 %}

```jsx {% demo=true %}
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="grid">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i}>
          <Suspense fallback={<span>⏳</span>}>
            <SlowCheckmark />
          </Suspense>
        </div>
      ))}
    </div>
  );
}

// this component will take between 500ms and 2500ms to render
async function SlowCheckmark() {
  const delay = Math.floor(Math.random() * 2500) + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return <span>✅</span>;
}
```

{% /demo1 %}

If you haven't used Suspense before the idea is that you can wrap a component in a `<Suspense>` tag and while that component is loading React will show a fallback UI. In our case, a span with a ⏳ icon.

That by itself is pretty neat, but there's a few often unnoticed features in the code above:

- Rendering starts on the server as soon as the HTTP request comes in, well before the browser has received any HTML or loaded any client-side JavaScript.
- Streaming happens over a single HTTP connection. No matter how many individual components suspend, they all send their data to the client in the same HTTP response.
- Rendering is out of order. Each checkbox takes a random amount of time to render, but they're displayed as soon as they’re ready, regardless of their order on the page.

The combination of these abilities unlock some pretty interesting ideas that can be applied to real-world UIs.

In this post, we'll look at two such examples.

## A blog post with comments

A blog post can take advantage of streaming by first showing the post, and then streaming in the comments. With streaming, the post is readable while the comments are being loaded.

{% demo2 /%}

Streaming in content that is not initially visible on the page is an easy win for improving the user experience of an app.

Here's the code for a post with streaming comments.

```jsx
import { Suspense } from "react";
import { cms } from "@/cms";

export async function Page() {
  const post = await cms.posts.findFirst({
    where: { slug: "streaming-with-suspense" },
  });

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      <Suspense fallback={<span>Loading comments...</span>}>
        <Comments slug="streaming-with-suspense" />
      </Suspense>
    </div>
  );
}

async function Comments({ slug }) {
  const comments = await cms.comments.findAll({
    where: { slug },
  });

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.content}</li>
      ))}
    </ul>
  );
}
```

Similar to the checkbox example, we wrap the `<Comments>` component in a `<Suspense>` tag. The post page is shown as soon as it's ready and is not blocked by the data-fetch for the comments.

Now, I'll be the first to tell you that lazily loading content is not exactly cutting-edge technology. You can still find [blog posts from 2005](https://www.quirksmode.org/blog/archives/2005/12/the_ajax_respon.html) (20 years ago!) recommending this technique.

However, there's something interesting about React's approach. The streaming is turned on by adding a `<Suspense>` tag around the `<Comments>` component.

{% demo3 /%}

That's it! No extra configuration, no special server setup, and no need to use a different programming model. Wrap your component in `<Suspense>` and React handles the rest.

This is what makes streaming with React's Suspense so powerful. It allows you to add streaming to your app without having to rewrite parts of your codebase or come up with a new architecture to support lazily loading content.

This is all possible because React's Suspense was designed to be composable. You can take any component, wrap it in `<Suspense>`, and it will start streaming its content as soon as it's ready.

Let's see how far we can take this composability with a more complex example.

## An account specific dropdown

Here's a chat box UI where you can select an LLM model to chat with.

{% demo4 /%}

The models listed in the dropdown are specific to the current user. In this example, our user doesn't have access to the "Advanced reasoning" model because they haven't purchased it.

Since the options in the dropdown depend on the user's account, we cannot render the chat box until we've looked up what models the user has access to.

### Streaming the dropdown

Like the blog comments example, we can use `<Suspense>` to stream in the dropdown.

We'll use [Headless UI's Listbox](https://headlessui.com/react/listbox) component to render a dropdown of available models. If we wrap the dropdown in `<Suspense>`, the list of models becomes lazily loaded.

{% demo5 %}

```jsx {% demo=true %}
import { Suspense } from "react";
import { ModelsListbox } from "./client-component";

function ChatBox() {
  return (
    <form>
      <textarea defaultValue="Chat with your favorite AI model..." />

      <Suspense fallback={<span>Loading models...</span>}>
        <CurrentUsersListbox />
      </Suspense>
    </form>
  );
}

async function CurrentUsersListbox() {
  const currentUser = await getCurrentUser();
  const models = await getModelsForUser(currentUser);

  return <ModelsListbox models={models} />;
}

// ![client-component-boundary]

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

export function ModelsListbox({ models }) {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  return (
    <Listbox value={selectedModel} onChange={setSelectedModel}>
      <ListboxButton>{selectedModel.name}</ListboxButton>
      <ListboxOptions>
        {models.map((model) => (
          <ListboxOption
            key={model.id}
            value={model}
            disabled={model.isDisabled}
          >
            {model.name}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
```

{% /demo5 %}

The chat box renders immediately, and the dropdown shows a loading indicator while the models are being fetched. Once the data is ready, the dropdown is streamed in from the server.

While this works, I'd argue the user experience is not ideal. The dropdown flashes from a loading state to the actual options, which is quite jarring.

Also, it's worth pointing out that the chat box isn't really submittable until the dropdown has loaded. If the user tries to send a message before the dropdown is loaded, they won't be able to select a model, which is required for the chat box to work.

### Composable streaming

To improve this, let's move the `<Suspense>` tag to only surround the `<ListboxOptions>`, instead of the entire Listbox component.

{% demo6 %}

```jsx {% demo=true %}
import { Suspense } from "react";
import { ModelsListbox, ModelsOptions } from "./client-component";

function ChatBox() {
  return (
    <form>
      <textarea defaultValue="Chat with your favorite AI model..." />

      <ModelsListbox>
        <Suspense fallback={<span>Loading models...</span>}>
          <CurrentUsersOptions />
        </Suspense>
      </ModelsListbox>
    </form>
  );
}

async function CurrentUsersOptions() {
  const currentUser = await getCurrentUser();
  const models = await getModelsForUser(currentUser);

  return <ModelsOptions models={models} />;
}

// ![client-component-boundary]

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

const defaultModel = {
  id: "gpt-mini",
  name: "GPT Mini",
  isDisabled: false,
};

export function ModelsListbox({ children }) {
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  return (
    <Listbox value={selectedModel} onChange={setSelectedModel}>
      <ListboxButton>{selectedModel.name}</ListboxButton>
      <ListboxOptions>{children}</ListboxOptions>
    </Listbox>
  );
}

export function ModelsOptions({ models }) {
  return (
    <>
      {models.map((model) => (
        <ListboxOption key={model.id} value={model} disabled={model.isDisabled}>
          {model.name}
        </ListboxOption>
      ))}
    </>
  );
}
```

{% /demo6 %}

Now not only does the chat box render immediately, but the dropdown is interactive while the options are still loading. In this case, even if the options haven't yet loaded, the chat box is still submittable with the default model selected.

And making this change was straightforward once you understand how to compose with Suspense. In our case, all we needed was a new `<ModelsOptions>` component wrapped in `<Suspense>`.

This is a testament to React's composability. Headless UI's `<Listbox>` didn't need to be designed with lazily loaded options in mind. At no point did the authors of `<Listbox>` have to consider streaming or lazy loading when they built their component library.

Because it's a composable component library, Headless UI works seamlessly with React's streaming capabilities.

Now, I want to point out that in this example the models take several seconds to load. My intention here was to give you enough time to see the dropdown in it's loading state. However, in a real-world application the models will most likely be loaded before the user even has time to open up the dropdown.

### Rendering and data-fetching

I've found that using `<Suspense>` to stream down data-fetching components hits a sweet spot for me in terms of both rendering and data-fetching.

In the chat box example, we're able to render immediately, while kicking off the data-fetch for the models as soon as the HTTP request comes into the server. We're then able to stream down the options without delaying any other rendering or data-fetching.

The worst case scenario for this UI is that the user opens the dropdown before the options have loaded. In that case they see the loading state.

I love how `<Suspense>` makes it easy to pick which parts of the UI should stream and which parts should render immediately. The fact that it composes with any component, even those that existed before streaming was added to React, makes this pattern incredibly powerful.

At the end of the day, you can adopt streaming with Suspense without having to redo your data-fetching strategy, rewrite your components, or be forced to pick any new 3rd-party component libraries.

Thanks for reading! I love talking about React and RSCs. If you have any questions or comments please reach out to me on [Twitter](https://x.com/ryantotweets) or [Bluesky](https://bsky.app/profile/ryantoron.to).
