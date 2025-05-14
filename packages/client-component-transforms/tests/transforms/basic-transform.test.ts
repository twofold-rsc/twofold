import { expect, test, describe } from "vitest";
import { transform } from "../../src/index.js";
import dedent from "dedent";

describe("transforms", () => {
  test("it should not alter a module that does not have the use client directive", async () => {
    let code = dedent`
      export function Title() {
        return <div>A title tag</div>;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(0);
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx } from "react/jsx-runtime";
      function Title() {
        return /* @__PURE__ */ jsx("div", { children: "A title tag" });
      }
      export {
        Title
      };
      "
    `);
  });

  test("it should transform a module that has the use client directive", async () => {
    let code = dedent`
      "use client";

      export function Title() {
        return <div>A title tag</div>;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export const Title = proxy['Title'];"
    `);
  });

  test("it should transform the default export", async () => {
    let code = dedent`
      "use client";

      export default function Title() {
        return <div>A title tag</div>;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export default proxy['default'];"
    `);
  });

  test("it should transform multiple exports", async () => {
    let code = dedent`
      "use client";

      export default function Title() {
        return <div>A title tag</div>;
      }
      
      export function Subtitle() {
        return <div>A subtitle tag</div>;
      }

      export const Footer = () => {
        return <div>A footer tag</div>;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(3);
    expect(result.clientComponents).toContain("default");
    expect(result.clientComponents).toContain("Subtitle");
    expect(result.clientComponents).toContain("Footer");
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export const Footer = proxy['Footer'];
      export const Subtitle = proxy['Subtitle'];
      export default proxy['default'];"
    `);
  });

  test("it should transform non-react exports", async () => {
    let code = dedent`
      "use client";

      export function add(a, b) {
        return a + b;
      }

      export const pi = 3.14;
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(2);
    expect(result.clientComponents).toContain("add");
    expect(result.clientComponents).toContain("pi");
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export const add = proxy['add'];
      export const pi = proxy['pi'];"
    `);
  });

  test("it should transform exports under a different name", async () => {
    let code = dedent`
      "use client";

      function Title() {
        return <div>A title tag</div>;
      }

      export { Title as MyTitle };
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(1);
    expect(result.clientComponents).toContain("MyTitle");
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export const MyTitle = proxy['MyTitle'];"
    `);
  });

  test("it should transform components exported from other modules", async () => {
    let code = dedent`
      "use client";
      export { Title } from "./title";
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(1);
    expect(result.clientComponents).toContain("Title");
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export const Title = proxy['Title'];"
    `);
  });

  test("it should transform modules with multiple directives", async () => {
    let code = dedent`
      "use strict";
      "use client";

      export default function Title() {
        return <div>A title tag</div>;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.clientComponents).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
      let proxy = createClientModuleProxy("test");

      export default proxy['default'];"
    `);
  });
});
