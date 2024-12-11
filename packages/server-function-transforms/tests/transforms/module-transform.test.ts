import { describe, test, expect } from "vitest";
import dedent from "dedent";
import { transform } from "../../src";

describe("module transform", () => {
  test("it should not transform a module that does not have a 'use server' directive", async () => {
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual([]);
    expect(result.code).toMatchInlineSnapshot(`
      "let count = 0;
      function increment() {
        count = count + 1;
      }
      export { increment };"
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      export { increment };
      registerServerReference(increment, "test", "increment");"
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      function decrement() {
        count = count - 1;
      }
      export { increment };
      registerServerReference(increment, "test", "increment");"
    `);
  });

  test("it should transform a use server function from a use server module", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export function increment() {
        "use server";
        count = count + 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        "use server";

        count = count + 1;
      }
      export { increment };
      registerServerReference(increment, "test", "increment");"
    `);
  });

  test("it should transform multiple exported function", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export function increment() {
        count = count + 1;
      }

      export function decrement() {
        count = count - 1;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(2);
    expect(result.serverFunctions).toContain("increment");
    expect(result.serverFunctions).toContain("decrement");
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      function decrement() {
        count = count - 1;
      }
      export { decrement, increment };
      registerServerReference(increment, "test", "increment");
      registerServerReference(decrement, "test", "decrement");"
    `);
  });

  test("it should transform export specifiers that are functions", async () => {
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      export { increment };
      registerServerReference(increment, "test", "increment");"
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["addOne"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      export { increment as addOne };
      registerServerReference(increment, "test", "addOne");"
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["default"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      export { increment as default };
      registerServerReference(increment, "test", "default");"
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["count", "database"]);
  });

  test("it should transform function expressions", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export const add1 = function() {
        count = count + 1;
      };
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["add1"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      const add1 = function () {
        count = count + 1;
      };
      export { add1 };
      registerServerReference(add1, "test", "add1");"
    `);
  });

  test("it should transform many function expressions", async () => {
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(5);
    expect(result.serverFunctions).toContain("add1");
    expect(result.serverFunctions).toContain("add10");
    expect(result.serverFunctions).toContain("addOneHundred");
    expect(result.serverFunctions).toContain("newAdd1_000");
    expect(result.serverFunctions).toContain("default");

    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      const add1 = function () {
        count = count + 1;
      };
      const add10 = function () {
        count = count + 10;
      };
      const add100 = function () {
        count = count + 100;
      };
      const add1_000 = function () {
        count = count + 1e3;
      };
      const newAdd1_000 = add1_000;
      const add10_000 = function () {
        count = count + 1e4;
      };
      var stdin_default = add10_000;
      export { add1, add10, add100 as addOneHundred, stdin_default as default, newAdd1_000 };
      registerServerReference(newAdd1_000, "test", "newAdd1_000");
      registerServerReference(stdin_default, "test", "default");
      registerServerReference(add100, "test", "addOneHundred");
      registerServerReference(add10, "test", "add10");
      registerServerReference(add1, "test", "add1");"
    `);
  });

  test("it should transform arrow functions", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export const add1 = () => {
        count = count + 1;
      };
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["add1"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      const add1 = () => {
        count = count + 1;
      };
      export { add1 };
      registerServerReference(add1, "test", "add1");"
    `);
  });

  test("it should transform many different arrow functions", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export const add1 = () => {
        count = count + 1;
      };

      const add10 = () => {
        count = count + 10;
      }
      export { add10 };

      const add100 = () => {
        count = count + 100;
      }
      export { add100 as addOneHundred };

      const add1_000 = () => {
        count = count + 1_000;
      }
      const newAdd1_000 = add1_000;
      export { newAdd1_000 }

      const add10_000 = () => {
        count = count + 10_000;
      }
      export default add10_000;
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
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
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      const add1 = () => {
        count = count + 1;
      };
      const add10 = () => {
        count = count + 10;
      };
      const add100 = () => {
        count = count + 100;
      };
      const add1_000 = () => {
        count = count + 1e3;
      };
      const newAdd1_000 = add1_000;
      const add10_000 = () => {
        count = count + 1e4;
      };
      var stdin_default = add10_000;
      export { add1, add10, add100 as addOneHundred, stdin_default as default, newAdd1_000 };
      registerServerReference(newAdd1_000, "test", "newAdd1_000");
      registerServerReference(stdin_default, "test", "default");
      registerServerReference(add100, "test", "addOneHundred");
      registerServerReference(add10, "test", "add10");
      registerServerReference(add1, "test", "add1");"
    `);
  });
});

describe("factory functions", () => {
  test.skip("it should transform a factory function", async () => {
    // im not sure what the correct behavior here should be?
    let code = dedent`
      "use server";

      import { verifyUser } from "./auth";

      let count = 0;

      function withAuth(action) {
        return () => {
          "use server";
          if (verifyUser()) {
            action();
          }
        };
      }

      export const increment = withAuth(() => { 
        "use server";
        count = count + 1;
      });
    `;

    let result = await transform({
      input: {
        code,
        language: "ts",
      },
      moduleId: "test",
    });

    // expect(result.serverFunctions).toHaveLength(2);
    // expect(result.code).toMatchInlineSnapshot();
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
      moduleId: "test",
    });

    expect(result.serverFunctions).toEqual(["increment"]);
    expect(result.code).toMatchInlineSnapshot(`
      ""use server";

      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      let count = 0;
      function increment() {
        count = count + 1;
      }
      export { increment };
      registerServerReference(increment, "test", "increment");"
    `);
  });
});
