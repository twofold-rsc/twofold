---
lastUpdated: "2025-05-19T08:00:00Z"
description: "A look real-world UIs that rely on streaming with Suspense"
---

# Composable streaming with Suspense

One line intro, read writing blog post.

Take a look at this code that uses `<Suspense>` to stream down sixteen components instances from the server to the client:

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

If you haven't used suspense before the idea is that you can wrap a component in a `<Suspense>` tag and while that component is loading React will show a fallback UI. In our case, a span with an ⏳ icon.

That by itself is pretty neat, but there's a few often unnoticed features in the code above:

- Rendering starts on the server as soon as the HTTP request comes in, well before any client-side JavaScript is loaded.
- Streaming happens over a single HTTP connection. No matter how many individual components suspend, they will all send down their data over the same connection.
- Rendering is out of order. Each checkbox takes a random amount of time to render, but we're able to display them as soon as they’re ready, regardless of their order on the page.

The combination of these abilities unlock some pretty interesting ideas that can be now be applied to real-world UIs.

In this post, we'll look at two such examples.

## A blog post with comments

A blog post can take advantage of streaming by first showing the post, and then lazily loading in the comments. Visitors can start reading the post while the comments are still loading.

{% demo2 /%}

Streaming in content that is below the fold is a great way to improve the perceived performance of an app. Dynamic content that is not initially visible on the page is a excellent candidate for streaming with suspense.

The code for this example is straightforward. Our page loads the blog post and we have a `<Comments>` component that we wrap in suspense to lazily load the comments.

```jsx
export async function Page() {
  const post = await db.query.posts.findFirst({
    where: { slug: "streaming-with-suspense" },
  });

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      <Suspense fallback={<span>Loading comments...</span>}>
        <Comments slug="streaming-with-suspense" />
        // [!code highlight]
      </Suspense>
    </div>
  );
}

async function Comments({ slug }) {
  const comments = await db.query.comments.findMany({
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

Now, I'll be the first to tell you that lazily loading comments is not exactly cutting edge technology. You can still find blog posts from 2010 (15 years ago!) recommending this technique.

However, there's something unique about React's approach. The streaming is turned on by adding a `<Suspense>` boundary around the `<Comments>` component.

{% demo3 /%}

That's it! No extra configuration, no special server setup, and no need to use a different programming model. Just wrap your component in `<Suspense>` and React will handle the rest.

This is what makes streaming with React's Suspense so powerful. It allows you to adopt streaming in your app without having to rewrite parts of your codebase or come up with a new architecture to support lazily loading content.

This is all possible because React's Suspense was explicitly designed to be composable. You can take any component, wrap it in a `<Suspense>` boundary, and it will start streaming its content as soon as it's ready.

Let's see how far we can take this composability with a more complex example.

## An account specific menu

The next example is drop down menu that shows specific options based on the user's account. Here's a chat bot UI where you can select an LLM model to chat with.

{% demo4 /%}

The models listed in this dropdown are specific to the current user's plan. In this example, they don't have access to the "Advanced reasoning" model because they are on the free plan.

Since the options in the menu depend on the user's account, we cannot render the chat box until we've looked up the current user's plan.

### Streaming the dropdown

Like the blog comments example, we can use `<Suspense>` to lazily load the menu. This allows us to show the chat box immediately, while the menu options are still loading.

We'll use Headless UI's `<Listbox>` component to render the dropdown menu of available models. If we wrap `<Listbox>` in a `<Suspense>` boundary, the list of models will be lazily loaded based on the user's plan.

{% demo5 %}

```jsx {% demo=true %}
import { Suspense } from "react";
import { ModelsSelector } from "./client-component";

function ChatBox() {
  return (
    <form>
      <textarea defaultValue="Chat with your favorite AI model..." />

      <Suspense fallback={<span>Loading models...</span>}>
        <CurrentUserModels />
      </Suspense>
    </form>
  );
}

async function CurrentUserModels() {
  const currentUser = await getCurrentUser();
  const models = await getModelsForUser(currentUser);

  return <ModelSelector models={models} />;
}

// ![client-component-boundary]

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

export function ModelsSelector({ models }) {
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

Now the chat box renders immediately, and the dropdown shows a loading state while the models are being fetched. Once the options are ready, the dropdown is shown.

While this works, the UX is not ideal. The dropdown menu flashes from a loading state to the actual options once they are ready, which can be jarring for the user.

### Better UX with composable streaming

To improve this, we can move the `<Suspense>` boundary to only surround the `<ListboxOptions>`, and not the entire `<Listbox>` component.

{% demo6 %}

```jsx {% demo=true %}
import { Suspense } from "react";
import { ModelsSelector } from "./client-component";

function ChatBox() {
  return (
    <form>
      <textarea defaultValue="Chat with your favorite AI model..." />

      <ModelSelector>
        <Suspense fallback={<span>Loading models...</span>}>
          <CurrentUsersOptions />
        </Suspense>
      </ModelSelector>
    </form>
  );
}

async function CurrentUsersOptions() {
  const currentUser = await getCurrentUser();
  const models = await getModelsForUser(currentUser);

  return <ModelsSelectorOptions models={models} />;
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

export function ModelsSelector({ children }) {
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  return (
    <Listbox value={selectedModel} onChange={setSelectedModel}>
      <ListboxButton>{selectedModel.name}</ListboxButton>
      <ListboxOptions>{children}</ListboxOptions>
    </Listbox>
  );
}

export function ModelSelectorOptions({ models }) {
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

Now the chat box renders immediately and the dropdown menu is interactive while the options are still loading.

This is a testament to React's composability. Headless UI's `<Listbox>` didn't need to be designed with lazily loaded options in mind. At no point did the authors of `<Listbox>` have to consider streaming or Suspense when they built their component library.

All we had to do to make the list of models lazily loaded was to wrap the specific parts of the UI that depend on the user's plan in a `<Suspense>` boundary.

This composition story is what makes React's streaming with Suspense so powerful. It allows you to take existing components, wrap them in `<Suspense>`, and start streaming their content without having to change the underlying component or pick a different component library.
