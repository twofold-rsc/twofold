import { test, describe, expect } from "vitest";
import { codeToHtml } from "shiki";
import { transformerClientBoundary } from "../src/index";
import dedent from "dedent";

describe("Transformer", () => {
  test("it should replace [!client-boundary] with an svg", async () => {
    let code = dedent`
      import { ClientComponent } from "./client-component";

      function ServerComponent() {
        return (
          <div>
            <h1>Server Component</h1>
            <ClientComponent />
          </div>
        );
      }

      // [!client-boundary]

      "use client";

      import { useState } from "react";

      export function ClientComponent() {
        const [count, setCount] = useState(0);

        return (
          <div>
            <p>Client Component count: {count}</p>

            <button onClick={() => setCount((c) => c + 1)}>
              Increment
            </button>
          </div>
        );
      }
    `;

    const result = await codeToHtml(code, {
      lang: "jsx",
      theme: "nord",
      transformers: [transformerClientBoundary()],
    });

    expect(result).not.toContain("[!client-boundary]");
    expect(result).toContain("<svg");
    expect(result).toContain('class="client-component-boundary"');
  });

  test("it should set a min width based on segments and min segment width", async () => {
    let code = dedent`
      import { ClientComponent } from "./client-component";

      function ServerComponent() {}

      // [!client-boundary]

      "use client";

      export function ClientComponent() {}
    `;

    const result = await codeToHtml(code, {
      lang: "jsx",
      theme: "nord",
      transformers: [
        transformerClientBoundary({
          segments: 50,
          minSegmentWidth: 8,
        }),
      ],
    });

    expect(result).not.toContain("[!client-boundary]");
    expect(result).toContain("min-width: 400px;");
  });

  test("it should work with a token that has whitespace", async () => {
    let code = `
      import { ClientComponent } from "./client-component";

      function ServerComponent() {}

      // [!client-boundary] 

      "use client";

      export function ClientComponent() {}
    `;

    const result = await codeToHtml(code, {
      lang: "jsx",
      theme: "nord",
      transformers: [transformerClientBoundary()],
    });

    expect(result).not.toContain("[!client-boundary]");
    expect(result).toContain("<svg");
  });
});
