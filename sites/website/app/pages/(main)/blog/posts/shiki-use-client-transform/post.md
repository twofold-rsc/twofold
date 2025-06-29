---
lastUpdated: "2025-06-18T08:00:00Z"
description: "A Shiki transformer for displaying Server and Client components."
---

# Shiki and RSC code examples

Here's a Shiki transformer that helps you write RSC blog posts, docs, and code examples.

It's called `@twofold/shiki-transformer-client-boundary` and it automatically formats code examples to display both Server and Client components in a single code block.

Here's an example:

```jsx
import { ClientComponent } from "./client-component";

export function ServerComponent() {
  return (
    <div>
      <h1>Server Component</h1>
      <ClientComponent />
    </div>
  );
}

// ![client-boundary]

import { useState } from "react";

export function ClientComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>Client Component count: {count}</div>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

I first came across this design pattern in Dan Abramov's blog, [overreacted.io](https://overreacted.io/). He'll occasionally use this to display both Server and Client components in his posts {% footnote id=1 %}Check out Dan's excellent [Impossible components](https://overreacted.io/impossible-components/) post for an example.{% /footnote %}.

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

function ClientComponent() {}
```

Will output:

```jsx
function ServerComponent() {}

// ![client-boundary]

function ClientComponent() {}
```

## Styling

The styling of the boundary can be customized to fit your design needs. The transformer provides a default style, but you can modify it to match your blog or documentation's theme.

Here are all the available options and their default values:

```js
transformerClientBoundary({
  // The number of zig-zag segments to generate.
  segments: 40,

  // The vertical height of each wave segment. Larger values
  // create taller peaks and deeper valleys.
  amplitude: 5,

  // The horizontal spacing between each corner point. Controls
  // the wave's overall width and frequency.
  frequency: 8,

  // A value between 0 and 1 that controls the smoothness of the peaks.
  //   0 = sharp corners
  //   1 = smooth, sine-like curves
  peakSmoothness: 0.75,

  // Determines the line thickness as a fraction of step.
  strokeRatio: 0.15,

  // Extra vertical space added above and below the boundary.
  padding: 4,

  // Any additional CSS classes to apply to the boundary element.
  // Useful for adding custom styling, theming, or utility classes.
  class: "",

  // The color of the boundary line. Use `currentColor` if you are
  // styling with utility classes.
  color: "#d4d4d4",
});
```

Try adjusting the parameters above to see how they affect the appearance of the boundary.

{% theme-examples /%}

## Notes

The transformer automatically replaces the `// [!client-boundary]` comment with a UI to show the break between server and client modules. It also inserts a the `"use client"` directive at the top of the client module.

The reason it inserts `"use client"` is because directives must be placed at the top of a module or function in JavaScript. If you manually put `"use client"` in the middle of a file a code formatter will reformat it to a string surrounded by parentheses, since this is an invalid position for a directive. The transformer ensures that the directive is always at the top of the client module and prevents any formatting issues.
