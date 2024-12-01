import { expect, test, describe } from "vitest";
import { transform } from "../index.js";
import { transform as esbuildTransform } from "esbuild";
import dedent from "dedent";

async function rsc(strings: TemplateStringsArray, ...values: any[]) {
  let content = strings.reduce(
    (result, str, i) => result + str + (values[i] || ""),
    "",
  );

  let result = await esbuildTransform(dedent(content), {
    loader: "tsx",
    jsx: "automatic",
    format: "esm",
  });

  if (result.code) {
    return result.code;
  } else {
    throw new Error("Failed to transform code");
  }
}

describe("transforms", () => {
  test("it should not alter a file without server functions", async () => {
    let code = await rsc`
      export async function Page() {
        return <div>Hello World</div>;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(0);
    expect(result.code).toMatchInlineSnapshot(`
      "import { jsx } from "react/jsx-runtime";
      async function Page() {
        return /* @__PURE__ */jsx("div", {
          children: "Hello World"
        });
      }
      export { Page };"
    `);
  });

  test("it should transform a 'use server' function defined in module scope", async () => {
    let code = await rsc`
      let count = 0;

      function increment() {
        "use server";
        count = count + 1;
      }
        
      export default function Page() {
        return <form action={increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toContain(
      'import { registerServerReference } from "react-server-dom-webpack/server.edge";',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      const increment = tf$serverFunction0;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });

  test("it should transform multiple 'use server' functions defined in module scope", async () => {
    let code = await rsc`
      let count = 0;

      function increment() {
        "use server";
        count = count + 1;
      }

      function decrement() {
        "use server";
        count = count - 1;
      }
        
      export default function Page() {
        return (
          <form>
            <button formAction={increment}>Increment</button>
            <button formAction={decrement}>Decrement</button>
          </form>
        );
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(2);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx, jsxs } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      const increment = tf$serverFunction0;
      function tf$serverFunction1() {
        "use server";

        count = count - 1;
      }
      registerServerReference(tf$serverFunction1, "test", "tf$serverFunction1");
      const decrement = tf$serverFunction1;
      function Page() {
        return /* @__PURE__ */jsxs("form", {
          children: [/* @__PURE__ */jsx("button", {
            formAction: increment,
            children: "Increment"
          }), /* @__PURE__ */jsx("button", {
            formAction: decrement,
            children: "Decrement"
          })]
        });
      }
      export { Page as default };
      export { tf$serverFunction0, tf$serverFunction1 };"
    `);
  });

  test("it should transform a 'use server' function defined in a function expression", async () => {
    let code = await rsc`
      let count = 0;

      let increment = function() {
        "use server";
        count = count + 1;
      }
        
      export default function Page() {
        return <form action={increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      let increment = tf$serverFunction0;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });

  test("it should transform a 'use server' function defined in an arrow function", async () => {
    let code = await rsc`
      let count = 0;

      let increment = () => {
        "use server";
        count = count + 1;
      }
        
      export default function Page() {
        return <form action={increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      let increment = tf$serverFunction0;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });
});

describe("hoisting", () => {
  test("it should hoist 'use server' functions to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        function increment() {
          "use server";
          count = count + 1;
        }

        return <form action={increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        const increment = tf$serverFunction0;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });

  test("it should hoist a 'use server' function defined as a function expression to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        let increment = function() {
          "use server";
          count = count + 1;
        };

        return <form action={increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        let increment = tf$serverFunction0;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });

  test("it should hoist a 'use server' function defined as an arrow function to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        let increment = () => {
          "use server";
          count = count + 1;
        };

        return <form action={increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        let increment = tf$serverFunction0;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });

  test("it should hoist an anonymous 'use server' function to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        return <form action={() => {
          "use server";
          count = count + 1;
        }} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: tf$serverFunction0
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });
});

describe("closures and captured variables", () => {
  test("it should move closed over variables to hoisted function arguments", async () => {
    let code = await rsc`
      export default function Page({ name }) {
        function greet() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction0(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        const tf$serverFunction0$binding = tf$serverFunction0.bind(null, name);
        const greet = tf$serverFunction0$binding;
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });
});

// function within function

// these are important when hoisting
// test.skip("two components, each with same function name, hoist should not clash", async () => {});
// test.skip("it should compile multiple anonymous 'use server' functions", async () => {});
