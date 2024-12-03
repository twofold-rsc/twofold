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

  test.only("it should transform a 'use server' function defined in module scope", async () => {
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

    // register the original name of the function
    // track name->export pair
    console.log(result.code);

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
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      let obj = {
        increment: tf$serverFunction0
      };
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: obj.increment
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
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        let obj = {
          increment: tf$serverFunction0
        };
        return /* @__PURE__ */jsx("form", {
          action: obj.increment
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
        let list = [1, 2, tf$serverFunction0];
        return /* @__PURE__ */jsx("form", {
          action: list[2]
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        let myObject = {
          prop: tf$serverFunction0
        };
        return /* @__PURE__ */jsx("form", {
          action: myObject.prop
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });

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
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        let myObject = {
          prop: tf$serverFunction0
        };
        return /* @__PURE__ */jsx("form", {
          action: myObject.prop
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page() {
        function getIncrement() {
          return tf$serverFunction0;
        }
        return /* @__PURE__ */jsx("form", {
          action: getIncrement()
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        const greet = tf$serverFunction0.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(name) {
        "use server";

        console.log(greeting, name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        const greet = tf$serverFunction0.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(name) {
        "use server";

        db.query("INSERT INTO users (name) VALUES ($1)", [name]);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        const greet = tf$serverFunction0.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(greeting, name) {
        "use server";

        console.log(greeting, name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      async function Page({
        name
      }) {
        let result = await db.query("SELECT greeting FROM greetings WHERE name = $1", [name]);
        let greeting = result.rows[0].greeting;
        const greet = tf$serverFunction0.bind(null, greeting, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        const greet = tf$serverFunction0.bind(null, name);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        return /* @__PURE__ */jsx("form", {
          action: tf$serverFunction0.bind(null, name)
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(name) {
        "use server";

        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        let obj = {
          greet: tf$serverFunction0.bind(null, name)
        };
        return /* @__PURE__ */jsx("form", {
          action: obj.greet
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
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
      function tf$serverFunction0(greet) {
        "use server";

        greet();
      }
      registerServerReference(tf$serverFunction0, "test", "tf$serverFunction0");
      function Page({
        name
      }) {
        function greet() {
          console.log("hello", name);
        }
        const action = tf$serverFunction0.bind(null, greet);
        return /* @__PURE__ */jsx("form", {
          action
        });
      }
      export { Page as default };
      export { tf$serverFunction0 };"
    `);
  });
});
