---
lastUpdated: "2025-07-13T08:00:00Z"
description: "A Shiki transformer for displaying Server and Client components."
---

# Shiki and RSC code examples

{% playground-provider %}

Have you ever wanted to show a Server and Client Component in the same code block while writing a blog post or working on your docs?

Here's a [Shiki](https://shiki.style/) transformer that lets you do exactly that! Check out this example:

{% opening-example /%}

This code block uses `@twofold/shiki-transformer-client-boundary` to draw a boundary between the Server and Client Components.

I first came across this design pattern in Dan Abramov's blog, [overreacted.io](https://overreacted.io/). He'll occasionally use a similar design in his posts {% footnote id=1 %}Check out Dan's excellent [Impossible components](https://overreacted.io/impossible-components/) post for an example.{% /footnote %}.

A feature of this boundary is that it's fully themeable and can be customized to fit any design. Here are a few examples:

{% presets /%}

{% basic-example /%}

In this post we'll cover how to install, use, and style the boundary for your blog or docs site.

{% /playground-provider %}

## Getting started

Install the package using:

{% cli-command selectable=true shadow=false mobileOverflow=true %}
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

The comment {% standout-comment %}// [!client-boundary]{% /standout-comment %} in your code examples indicates where the Server Component ends and Client Component starts. The transformer will format the code to display both components correctly.

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

{% basic-example /%}

## Styling

The styling of the boundary can be customized to fit your design needs. The transformer provides a default style, but you can modify it to match your blog or documentation's theme.

Try adjusting the parameters below to see how they affect the appearance of the boundary.

{% playground-provider %}

{% playground /%}

Here's the code needed to generate your styled boundary using Shiki:

{% playground-config /%}

{% /playground-provider %}

Thanks for reading! If you use this plugin or have any questions about it feel free to reach out to me on [Twitter](https://x.com/ryantotweets) or [Bluesky](https://bsky.app/profile/ryantoron.to).

## Notes

- Some code formatters, like Prettier, may automatically reformat the `"use client"` directive to `("use client")` if it's not at the top of the file. You can add `// prettier-ignore` before the directive to prevent this behavior.

- Server and Client Components were explicitly designed to live in separate modules, so combining them in the same code block sort of violates that principle. I find this plugin works well for small examples, but for large examples it's probably best to keep your Server components and Client components in separate code blocks.
