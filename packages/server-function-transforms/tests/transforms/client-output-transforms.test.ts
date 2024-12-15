import { describe, test, expect } from "vitest";
import dedent from "dedent";
import { transform } from "../../src";

describe("module transform", () => {
  test("it should not export any call servers from a module that does not have a 'use server' directive", async () => {
    let code = dedent`
      let count = 0;

      export function increment() {
        count = count + 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual([]);
    expect(result.code).toMatchInlineSnapshot(`
      "let count = 0;
      function increment() {
        count = count + 1;
      }
      export {
        increment
      };
      "
    `);
  });

  test("it should transform a 'use server' module", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export function increment() {
        count = count + 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toContain(
      'import { callServer } from "framework/call-server";',
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const increment = createServerReference("test#increment", callServer);"
    `);
  });

  test("it should transform only exported functions", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export function increment() {
        count = count + 1;
      }

      function decrement() {
        count = count - 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const increment = createServerReference("test#increment", callServer);"
    `);
  });

  test("it should transform multiple exported function", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export const add1 = function() {
        count = count + 1;
      };

      const add10 = function() {
        count = count + 10;
      }
      export { add10 };

      const add100 = function() {
        count = count + 100;
      }
      export { add100 as addOneHundred };

      const add1_000 = function() {
        count = count + 1_000;
      }
      const newAdd1_000 = add1_000;
      export { newAdd1_000 }

      const add10_000 = function() {
        count = count + 10_000;
      }
      export default add10_000;
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(5);
    expect(result.serverFunctions).toContain("add1");
    expect(result.serverFunctions).toContain("add10");
    expect(result.serverFunctions).toContain("addOneHundred");
    expect(result.serverFunctions).toContain("newAdd1_000");
    expect(result.serverFunctions).toContain("default");
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const add1 = createServerReference("test#add1", callServer);
      export const add10 = createServerReference("test#add10", callServer);
      export const addOneHundred = createServerReference("test#addOneHundred", callServer);
      export default createServerReference("test#default", callServer);
      export const newAdd1_000 = createServerReference("test#newAdd1_000", callServer);"
    `);
  });

  test("it should transform export specifiers", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      function increment() {
        count = count + 1;
      }

      export { increment };
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const increment = createServerReference("test#increment", callServer);"
    `);
  });

  test("it should transform exports that have a different name", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      function increment() {
        count = count + 1;
      }

      export { increment as addOne };
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["addOne"]);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const addOne = createServerReference("test#addOne", callServer);"
    `);
  });

  test("it should transform the default export function", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export default function increment() {
        count = count + 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["default"]);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export default createServerReference("test#default", callServer);"
    `);
  });

  test("it should transform all exports", async () => {
    // should we only transform functions?
    // maybe this should error?
    let code = dedent`
      "use server";

      let count = 0;
      export { count };

      export const database = { name: "test" };
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(2);
    expect(result.serverFunctions).toContain("count");
    expect(result.serverFunctions).toContain("database");
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const count = createServerReference("test#count", callServer);
      export const database = createServerReference("test#database", callServer);"
    `);
  });
});

describe("factory functions", () => {
  test("it should transform a factory function", async () => {
    // this works, but we kind of want to signal that the server-side
    // module needs to be built. not sure how to communicate that
    let code = dedent`
      "use server";

      let count = 0;

      function createIncrementor(amount) {
        return () => {
          "use server";
          count = count + amount;
        };
      }

      export const increment = createIncrementor(7);
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const increment = createServerReference("test#increment", callServer);"
    `);
  });
});

describe("JS tests", () => {
  test("it should transform a function declaration export", async () => {
    // silly test but module transformation relies on the fact that
    // esbuild normalizes exports in the AST. this test will fail if
    // that ever changes.
    let code = dedent`
      "use server";

      let count = 0;

      export function increment() {
        count = count + 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "js",
      },
      client: {
        callServerModule: "framework/call-server",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      "import { createServerReference } from "react-server-dom-webpack/client";
      import { callServer } from "framework/call-server";
      export const increment = createServerReference("test#increment", callServer);"
    `);
  });
});
