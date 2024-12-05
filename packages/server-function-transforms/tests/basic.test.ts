import { expect, test, describe } from "vitest";
import { transform } from "../src/index.js";
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

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/increment$/),
    );

    expect(result.code).toContain(
      'import { registerServerReference } from "react-server-dom-webpack/server.edge";',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      const increment = tf$serverFunction$0$increment;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
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
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/increment$/),
    );
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/decrement$/),
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx, jsxs } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      const increment = tf$serverFunction$0$increment;
      function tf$serverFunction$0$decrement() {
        "use server";

        count = count - 1;
      }
      registerServerReference(tf$serverFunction$0$decrement, "test", "tf$serverFunction$0$decrement");
      const decrement = tf$serverFunction$0$decrement;
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
      export { tf$serverFunction$0$increment, tf$serverFunction$0$decrement };"
    `);
  });

  test("it should keep the function async if it was given an async function", async () => {
    let code = await rsc`
      let count = 0;

      async function increment() {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 100));
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
      async function tf$serverFunction$0$increment() {
        "use server";

        await new Promise(resolve => setTimeout(resolve, 100));
        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      const increment = tf$serverFunction$0$increment;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
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
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/increment$/),
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      let increment = tf$serverFunction$0$increment;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
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
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/increment$/),
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      let increment = tf$serverFunction$0$increment;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
    `);
  });

  test("it should transform a 'use server' function defined in an object method", async () => {
    let code = await rsc`
      let count = 0;

      let obj = {
        increment() {
          "use server";
          count = count + 1;
        }
      };
        
      export default function Page() {
        return <form action={obj.increment} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/increment$/),
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      let obj = {
        increment: tf$serverFunction$0$increment
      };
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: obj.increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
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
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      function Page() {
        const increment = tf$serverFunction$0$increment;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
    `);
  });

  test.todo("multiple functions with the same name");

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
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      function Page() {
        let increment = tf$serverFunction$0$increment;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
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
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      function Page() {
        let increment = tf$serverFunction$0$increment;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
    `);
  });

  test("it should hoist a 'use server' function defined in an object method", async () => {
    let code = await rsc`
      let count = 0;
       
      export default function Page() {
        let obj = {
          increment() {
            "use server";
            count = count + 1;
          }
        };

        return <form action={obj.increment} />;
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
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      function Page() {
        let obj = {
          increment: tf$serverFunction$0$increment
        };
        return /* @__PURE__ */jsx("form", {
          action: obj.increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment };"
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
      function tf$serverFunction$0$action() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: tf$serverFunction$0$action
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });

  test("it should hoist an anonymous 'use server' function used in an array to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        let list = [1, 2, () => {
          "use server";
          count = count + 1;
        }];

        return <form action={list[2]} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.serverFunctions).toContainEqual(
      expect.stringMatching(/anonymous$/),
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$anonymous() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$anonymous, "test", "tf$serverFunction$0$anonymous");
      function Page() {
        let list = [1, 2, tf$serverFunction$0$anonymous];
        return /* @__PURE__ */jsx("form", {
          action: list[2]
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$anonymous };"
    `);
  });

  test("it should hoist an anonymous 'use server' function used as an object property to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        let myObject = {
          prop: () => {
            "use server";
            count = count + 1;
          }
        };

        return <form action={myObject.prop} />;
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
      function tf$serverFunction$0$prop() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$prop, "test", "tf$serverFunction$0$prop");
      function Page() {
        let myObject = {
          prop: tf$serverFunction$0$prop
        };
        return /* @__PURE__ */jsx("form", {
          action: myObject.prop
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$prop };"
    `);
  });

  test.todo("multiple anonymous functions");

  test("it should hoist a 'use server' function used as an object property to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        let myObject = {
          prop: function() {
            "use server";
            count = count + 1;
          }
        };

        return <form action={myObject.prop} />;
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
      function tf$serverFunction$0$prop() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$prop, "test", "tf$serverFunction$0$prop");
      function Page() {
        let myObject = {
          prop: tf$serverFunction$0$prop
        };
        return /* @__PURE__ */jsx("form", {
          action: myObject.prop
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$prop };"
    `);
  });

  test("it should hoist a 'use server' function returned from another function to the top of the module", async () => {
    let code = await rsc`
      let count = 0;
        
      export default function Page() {
        function getIncrement() {
          return function() {
            "use server";
            count = count + 1;
          };
        }

        return <form action={getIncrement()} />;
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
      function tf$serverFunction$0$anonymous() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$anonymous, "test", "tf$serverFunction$0$anonymous");
      function Page() {
        function getIncrement() {
          return tf$serverFunction$0$anonymous;
        }
        return /* @__PURE__ */jsx("form", {
          action: getIncrement()
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$anonymous };"
    `);
  });
});

describe("closures and captured variables", () => {
  test("it should move closed over variables to hoisted arguments", async () => {
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

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$greet(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should not move closed over variables that are in module scope", async () => {
    let code = await rsc`
      let greeting = "hello";

      export default function Page({ name }) {
        function greet() {
          "use server";
          console.log(greeting, name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let greeting = "hello";
      function tf$serverFunction$0$greet(name) {
        "use server";

        console.log(greeting, name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should not move closed over variables that are imported", async () => {
    let code = await rsc`
      import { db } from "./db";

      export default function Page({ name }) {
        function greet() {
          "use server";

          db.query("INSERT INTO users (name) VALUES ($1)", [name]);
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      import { db } from "./db";
      function tf$serverFunction$0$greet(name) {
        "use server";

        db.query("INSERT INTO users (name) VALUES ($1)", [name]);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move multiple closed over variables to arguments", async () => {
    let code = await rsc`
      import { db } from "./db";

      export default async function Page({ name }) {
        let result = await db.query("SELECT greeting FROM greetings WHERE name = $1", [name]);
        let greeting = result.rows[0].greeting;

        function greet() {
          "use server";
          console.log(greeting, name);
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      import { db } from "./db";
      function tf$serverFunction$0$greet(greeting, name) {
        "use server";

        console.log(greeting, name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      async function Page({
        name
      }) {
        let result = await db.query("SELECT greeting FROM greetings WHERE name = $1", [name]);
        let greeting = result.rows[0].greeting;
        const greet = tf$serverFunction$0$greet.bind(null, greeting, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move closed over variables in a function expression to arguments", async () => {
    let code = await rsc`
      export default function Page({ name }) {
        const greet = function() {
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

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$greet(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move closed over variables in an arrow function to arguments", async () => {
    let code = await rsc`
      export default function Page({ name }) {
        return <form action={() => {
          "use server";
          console.log("hello", name)
        }} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$action(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page({
        name
      }) {
        return /* @__PURE__ */jsx("form", {
          action: tf$serverFunction$0$action.bind(null, name)
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });

  test("it should move closed over variables in an object method to arguments", async () => {
    let code = await rsc`
      export default function Page({ name }) {
        let obj = {
          greet() {
            "use server";
            console.log("hello", name)
          }
        };
  
        return <form action={obj.greet} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$greet(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let obj = {
          greet: tf$serverFunction$0$greet.bind(null, name)
        };
        return /* @__PURE__ */jsx("form", {
          action: obj.greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move closed over functions to hoisted function arguments", async () => {
    // i don't think this is a valid RSC, but this tests makes sure
    // we can hoist up and bind in functions.
    let code = await rsc`
      export default function Page({ name }) {
        function greet() {
          console.log("hello", name)
        }

        function action() {
          "use server";
          greet();
        }
  
        return <form action={action} />;
      }
    `;

    let result = await transform({
      code,
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$action(greet) {
        "use server";

        greet();
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page({
        name
      }) {
        function greet() {
          console.log("hello", name);
        }
        const action = tf$serverFunction$0$action.bind(null, greet);
        return /* @__PURE__ */jsx("form", {
          action
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });
});
