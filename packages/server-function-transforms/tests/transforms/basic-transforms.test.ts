import { expect, test, describe } from "vitest";
import { transform } from "../../src/index.js";
import dedent from "dedent";

describe("transforms", () => {
  test("it should not alter a file without server functions", async () => {
    let code = dedent`
      export async function Page() {
        return <div>Hello World</div>;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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

  test("it should work with 'use server' functions that are already exported", async () => {
    let code = dedent`
      let count = 0;

      export function increment() {
        "use server";
        count = count + 1;
      }
        
      export default function Page() {
        return <form action={increment} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
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
      const increment = tf$serverFunction$0$increment;
      function Page() {
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default, increment };
      export { tf$serverFunction$0$increment };"
    `);
  });

  test("it should transform multiple 'use server' functions defined in module scope", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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

describe("errors", () => {
  test("it should error if the code has a syntax error", async () => {
    let code = dedent`
      export async function Page() {
        return <div>Hello World;
      }
    `;

    await expect(async () => {
      await transform({
        input: {
          code,
          language: "jsx",
        },
        moduleId: "test",
      });
    }).rejects.toThrowError(/Transform failed with 1 error/);
  });

  test("it should error if the wrong language is used", async () => {
    let code = dedent`
      export async function Page(props: MyProps) {
        return <div>Hello World<div>;
      }
    `;

    await expect(async () => {
      await transform({
        input: {
          code,
          language: "js",
        },
        moduleId: "test",
      });
    }).rejects.toThrowError(/Expected "\)" but found ":"/);
  });
});

describe("hoisting", () => {
  test("it should hoist 'use server' functions to the top of the module", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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

  test("it should hoist multiple functions with the same name", async () => {
    let code = dedent`
      let count = 0;

      export default function Page() {
        return (
          <>
            <ServerComponentA />
            <ServerComponentB />
          </>
        );
      }

      function ServerComponentA() {
        function increment() {
          "use server";
          count = count + 1;
        }

        return <form action={increment} />;
      }

      function ServerComponentB() {
        function increment() {
          "use server";
          count = count + 1;
        }

        return <form action={increment} />;
      } 
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(2);
    expect(result.serverFunctions).toContain("tf$serverFunction$0$increment");
    expect(result.serverFunctions).toContain("tf$serverFunction$1$increment");

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { Fragment, jsx, jsxs } from "react/jsx-runtime";
      let count = 0;
      function Page() {
        return /* @__PURE__ */jsxs(Fragment, {
          children: [/* @__PURE__ */jsx(ServerComponentA, {}), /* @__PURE__ */jsx(ServerComponentB, {})]
        });
      }
      function tf$serverFunction$0$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$increment, "test", "tf$serverFunction$0$increment");
      function ServerComponentA() {
        const increment = tf$serverFunction$0$increment;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      function tf$serverFunction$1$increment() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$1$increment, "test", "tf$serverFunction$1$increment");
      function ServerComponentB() {
        const increment = tf$serverFunction$1$increment;
        return /* @__PURE__ */jsx("form", {
          action: increment
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$increment, tf$serverFunction$1$increment };"
    `);
  });

  test("it should hoist a 'use server' function defined as a function expression to the top of the module", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
      let count = 0;
        
      export default function Page() {
        return <form action={() => {
          "use server";
          count = count + 1;
        }} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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

  test("it should hoist multiple anonymous 'use server' functions", async () => {
    let code = dedent`
      let count = 0;
        
      export default function Page() {
        return (
          <div>
            <form action={() => {
              "use server";
              count = count + 1;
            }} />
            <form action={() => {
              "use server";
              count = count + 1;
            }} />
          </div>
        );
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(2);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx, jsxs } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$action() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function tf$serverFunction$1$action() {
        "use server";

        count = count + 1;
      }
      registerServerReference(tf$serverFunction$1$action, "test", "tf$serverFunction$1$action");
      function Page() {
        return /* @__PURE__ */jsxs("div", {
          children: [/* @__PURE__ */jsx("form", {
            action: tf$serverFunction$0$action
          }), /* @__PURE__ */jsx("form", {
            action: tf$serverFunction$1$action
          })]
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action, tf$serverFunction$1$action };"
    `);
  });

  test("it should hoist a 'use server' function used as an object property to the top of the module", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
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
    let code = dedent`
      export default function Page({ name }) {
        function greet() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$greet(tf$bound$vars) {
        "use server";

        let [name] = tf$bound$vars;
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, [name]);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should not move closed over variables that are in module scope", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let greeting = "hello";
      function tf$serverFunction$0$greet(tf$bound$vars) {
        "use server";

        let [name] = tf$bound$vars;
        console.log(greeting, name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, [name]);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should not move closed over variables that are imported", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      import { db } from "./db";
      function tf$serverFunction$0$greet(tf$bound$vars) {
        "use server";

        let [name] = tf$bound$vars;
        db.query("INSERT INTO users (name) VALUES ($1)", [name]);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, [name]);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move multiple closed over variables to arguments", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      import { db } from "./db";
      function tf$serverFunction$0$greet(tf$bound$vars) {
        "use server";

        let [greeting, name] = tf$bound$vars;
        console.log(greeting, name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      async function Page({
        name
      }) {
        let result = await db.query("SELECT greeting FROM greetings WHERE name = $1", [name]);
        let greeting = result.rows[0].greeting;
        const greet = tf$serverFunction$0$greet.bind(null, [greeting, name]);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move closed over variables in a function expression to arguments", async () => {
    let code = dedent`
      export default function Page({ name }) {
        const greet = function() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$greet(tf$bound$vars) {
        "use server";

        let [name] = tf$bound$vars;
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, [name]);
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should move closed over variables in an arrow function to arguments", async () => {
    let code = dedent`
      export default function Page({ name }) {
        return <form action={() => {
          "use server";
          console.log("hello", name)
        }} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$action(tf$bound$vars) {
        "use server";

        let [name] = tf$bound$vars;
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page({
        name
      }) {
        return /* @__PURE__ */jsx("form", {
          action: tf$serverFunction$0$action.bind(null, [name])
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });

  test("it should move closed over variables in an object method to arguments", async () => {
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$greet(tf$bound$vars) {
        "use server";

        let [name] = tf$bound$vars;
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let obj = {
          greet: tf$serverFunction$0$greet.bind(null, [name])
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
    let code = dedent`
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
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$action(tf$bound$vars) {
        "use server";

        let [greet] = tf$bound$vars;
        greet();
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page({
        name
      }) {
        function greet() {
          console.log("hello", name);
        }
        const action = tf$serverFunction$0$action.bind(null, [greet]);
        return /* @__PURE__ */jsx("form", {
          action
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });

  test("it should be able to close over an object", async () => {
    let code = dedent`
      export default function Page({ name }) {
        let user = {
          name: "ryan"
        };

        function action() {
          "use server";
          console.log(user.name);
        }
  
        return <form action={action} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      function tf$serverFunction$0$action(tf$bound$vars) {
        "use server";

        let [user] = tf$bound$vars;
        console.log(user.name);
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page({
        name
      }) {
        let user = {
          name: "ryan"
        };
        const action = tf$serverFunction$0$action.bind(null, [user]);
        return /* @__PURE__ */jsx("form", {
          action
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });

  test("it should respect the order of closed over variables and manually bound variables", async () => {
    let code = dedent`
      export default function Page({ name }) {
        let other = 123;

        async function greet(other) {
          "use server";
          console.log("hello", name, other)
        }

        return <form action={greet.bind(null, other)} />;
      }
    `;

    let result = await transform({
      moduleId: "test",
      input: {
        code,
        language: "jsx",
      },
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      async function tf$serverFunction$0$greet(tf$bound$vars, other2) {
        "use server";

        let [name] = tf$bound$vars;
        console.log("hello", name, other2);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let other = 123;
        const greet = tf$serverFunction$0$greet.bind(null, [name]);
        return /* @__PURE__ */jsx("form", {
          action: greet.bind(null, other)
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });
});

describe("factory functions", () => {
  test("it should transform a factory function", async () => {
    let code = dedent`
      let count = 0;

      function createIncrementor(amount) {
        return () => {
          "use server";
          count = count + amount;
        };
      }
        
      export default function Page({ name }) {
        return <form action={createIncrementor(7)} />;
      }
    `;

    let result = await transform({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      let count = 0;
      function tf$serverFunction$0$anonymous(tf$bound$vars) {
        "use server";

        let [amount] = tf$bound$vars;
        count = count + amount;
      }
      registerServerReference(tf$serverFunction$0$anonymous, "test", "tf$serverFunction$0$anonymous");
      function createIncrementor(amount) {
        return tf$serverFunction$0$anonymous.bind(null, [amount]);
      }
      function Page({
        name
      }) {
        return /* @__PURE__ */jsx("form", {
          action: createIncrementor(7)
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$anonymous };"
    `);
  });
});
