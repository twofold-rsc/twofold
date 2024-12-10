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
      registerServerReference(increment, "test", "increment");
      export { increment };"
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
      registerServerReference(increment, "test", "increment");
      function decrement() {
        count = count - 1;
      }
      export { increment };"
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
      registerServerReference(increment, "test", "increment");
      function decrement() {
        count = count - 1;
      }
      registerServerReference(decrement, "test", "decrement");
      export { decrement, increment };"
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
      registerServerReference(increment, "test", "increment");
      export { increment };"
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
      registerServerReference(increment, "test", "addOne");
      export { increment as addOne };"
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
      registerServerReference(increment, "test", "default");
      export { increment as default };"
    `);
  });

  test("it should not transform non-function exports", async () => {
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

    expect(result.serverFunctions).toEqual([]);
  });

  test.todo("function expressions");

  test.only("it should transform arrow functions", async () => {
    let code = dedent`
      "use server";

      let count = 0;

      export const add1 = () => {
        count = count + 1;
      };

      // const add10 = () => {
      //   count = count + 10;
      // }
      // export { add10 };

      // const add100 = () => {
      //   count = count + 100;
      // }
      // export { add100 as addOneHundred };

      // const add1_000 = () => {
      //   count = count + 1_000;
      // }
      // const newAdd1_000 = add1_000;
      // export { newAdd1_000 }

      // const add10_000 = () => {
      //   count = count + 10_000;
      // }
      // export default add10_000;
    `;

    let result = await transform({
      input: {
        code,
        // TODO test js
        language: "ts",
      },
      moduleId: "test",
    });

    console.log(result.code);
  });
});
