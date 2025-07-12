---
lastUpdated: "2025-06-18T08:00:00Z"
description: "A Shiki transformer for displaying Server and Client components."
---

# Shiki and RSC code examples

{% playground-provider %}

Here's a Shiki transformer that helps you write RSC blog posts, docs, and code examples.

It's called `@twofold/shiki-transformer-client-boundary` and it automatically formats code examples to display both Server and Client components in a single code block.

Here's an example:

{% opening-example /%}

I first came across this design pattern in Dan Abramov's blog, [overreacted.io](https://overreacted.io/). He'll occasionally use this to display both Server and Client components in his posts {% footnote id=1 %}Check out Dan's excellent [Impossible components](https://overreacted.io/impossible-components/) post for an example.{% /footnote %}.

The boundary is fully themeable and can be customized to fit your design. Here are a few examples you can try out:

{% presets /%}

{% basic-example /%}

In the next section we'll go over how to install, use, and customize the boundary.

{% /playground-provider %}

## Usage

Install the package using:

{% cli-command selectable=true shadow=false %}
{% cli-tool name="pnpm" %}
pnpm install @twofold/shiki-transformer-client-boundary
{% /cli-tool %}
{% cli-tool name="npm" %}
npm install @twofold/shiki-transformer-client-boundary
{% /cli-tool %}
{% /cli-command %}

Then, use it with Shiki like this:

```js {% isClientBoundaryEnabled=false %}
import { codeToHtml } from "shiki";
import { transformerClientBoundary } from "@twofold/shiki-transformer-client-boundary";

const reactCodeExample = `
  function ServerComponent() {}

  // [!client-boundary]

  "use client";

  function ClientComponent() {}
`;

const code = await codeToHtml(reactCodeExample, {
  lang: "jsx", // or js, ts, tsx, etc.
  transformers: [transformerClientBoundary()],
});
```

The comment {% standout-comment %}// [!client-boundary]{% /standout-comment %} in your code examples indicates where the Server Component ends and Client Component starts. The transformer will automatically format the code to display both components correctly.

For example, the following code snippet:

```jsx {% isClientBoundaryEnabled=false %}
function ServerComponent() {}

// [!code highlight]
// [!client-boundary]

// [!remove]
// prettier-ignore
"use client";

function ClientComponent() {}
```

Will output:

```jsx
function ServerComponent() {}

// [!client-boundary]

// prettier-ignore
"use client";

function ClientComponent() {}
```

## Styling

The styling of the boundary can be customized to fit your design needs. The transformer provides a default style, but you can modify it to match your blog or documentation's theme.

Try adjusting the parameters above to see how they affect the appearance of the boundary.

{% playground-provider %}
{% playground /%}
{% /playground-provider %}

## Notes

Some code formatters, like Prettier, may automatically reformat the `"use client"` directive to `("use client")` if it's not at the top of the file. You can add `// prettier-ignore` before the directive to prevent this behavior.
