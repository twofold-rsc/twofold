import { expect, test, describe } from "vitest";
import dedent from "dedent";
import { transform } from "../../src/index";
import { envKey } from "../../src/index";
import { stringKey } from "../../src/key";

describe("encrypted captured variables", () => {
  test("it should encrypt and decrypt function declarations", async () => {
    let code = dedent`
      export default function Page({ name }) {
        async function greet() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      moduleId: "test",
      input: {
        code,
        language: "jsx",
      },
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
    });

    expect(result.code).toContain(
      'import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";',
    );

    expect(result.code).toContain(
      'if (typeof process.env["ENCRYPTION_KEY"] !== "string") {',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should encrypt and decrypt function expressions", async () => {
    let code = dedent`
      export default function Page({ name }) {
        const greet = async function() {
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
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should encrypt and decrypt arrow functions", async () => {
    let code = dedent`
      export default function Page({ name }) {
        return <form action={async () => {
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
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$action(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$action") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$action, "test", "tf$serverFunction$0$action");
      function Page({
        name
      }) {
        return /* @__PURE__ */jsx("form", {
          action: tf$serverFunction$0$action.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$action"], process.env["ENCRYPTION_KEY"]))
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$action };"
    `);
  });

  test("it should encrypt and decrypt object methods", async () => {
    let code = dedent`
      export default function Page({ name }) {
        let obj = {
          async greet() {
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
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
      moduleId: "test",
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let obj = {
          greet: tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], process.env["ENCRYPTION_KEY"]))
        };
        return /* @__PURE__ */jsx("form", {
          action: obj.greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should allow for a custom module to control encryption", async () => {
    let code = dedent`
      export default function Page({ name }) {
        async function greet() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      moduleId: "test",
      input: {
        code,
        language: "jsx",
      },
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
        module: "some/other/encrypt/module",
      },
    });

    expect(result.code).toContain(
      'import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "some/other/encrypt/module";',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "some/other/encrypt/module";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should encrypt and decrypt multiple captured variables", async () => {
    let code = dedent`
      export default function Page({ name }) {
        let other = 123;

        async function greet() {
          "use server";
          console.log("hello", name, other)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      moduleId: "test",
      input: {
        code,
        language: "jsx",
      },
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, other, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name, other);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let other = 123;
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, other, "test#tf$serverFunction$0$greet"], process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should error if a non-async function closes over variables", async () => {
    let code = dedent`
      export default function Page({ name }) {
        function greet() {
          "use server";
          console.log(name);
        }

        return <form action={greet} />;
      }
    `;

    await expect(async () => {
      await transform({
        input: {
          code,
          language: "jsx",
        },
        encryption: {
          key: envKey("ENCRYPTION_KEY"),
        },
        moduleId: "test",
      });
    }).rejects.toThrowError(
      "Server functions that close over variables must be async. Please turn greet into an async function.",
    );
  });

  test("it should not encrypt and decrypt manually bound args", async () => {
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
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
    });

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars, other2) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name, other2);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let other = 123;
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet.bind(null, other)
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });
});

describe("keys", () => {
  test("it should allow for ENV keys", async () => {
    let code = dedent`
      export default function Page({ name }) {
        async function greet() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      moduleId: "test",
      input: {
        code,
        language: "jsx",
      },
      encryption: {
        key: envKey("ENV_KEY"),
      },
    });

    expect(result.code).toContain(
      'let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENV_KEY"]);',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENV_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENV_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], process.env["ENV_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test("it should allow for string keys", async () => {
    let code = dedent`
      export default function Page({ name }) {
        async function greet() {
          "use server";
          console.log("hello", name)
        }
  
        return <form action={greet} />;
      }
    `;

    let result = await transform({
      moduleId: "test",
      input: {
        code,
        language: "jsx",
      },
      encryption: {
        key: stringKey("a-plain-text-string-password"),
      },
    });

    expect(result.code).toContain(
      'let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, "a-plain-text-string-password");',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof "a-plain-text-string-password" !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      async function tf$serverFunction$0$greet(tf$encrypted$vars) {
        "use server";

        let [name, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, "a-plain-text-string-password");
        if (tf$encrypted$id !== "test#tf$serverFunction$0$greet") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, tf$encrypt([name, "test#tf$serverFunction$0$greet"], "a-plain-text-string-password"));
        return /* @__PURE__ */jsx("form", {
          action: greet
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
        return async () => {
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
      encryption: {
        key: envKey("ENCRYPTION_KEY"),
      },
      moduleId: "test",
    });

    expect(result.serverFunctions).toHaveLength(1);
    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt as tf$encrypt, decrypt as tf$decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      if (typeof process.env["ENCRYPTION_KEY"] !== "string") {
        throw new Error("Invalid key. Encryption key is missing or undefined.");
      }
      let count = 0;
      async function tf$serverFunction$0$anonymous(tf$encrypted$vars) {
        "use server";

        let [amount, tf$encrypted$id] = await tf$decrypt(await tf$encrypted$vars, process.env["ENCRYPTION_KEY"]);
        if (tf$encrypted$id !== "test#tf$serverFunction$0$anonymous") {
          throw new Error("Server function could not be invoked: Signature mismatch");
        }
        count = count + amount;
      }
      registerServerReference(tf$serverFunction$0$anonymous, "test", "tf$serverFunction$0$anonymous");
      function createIncrementor(amount) {
        return tf$serverFunction$0$anonymous.bind(null, tf$encrypt([amount, "test#tf$serverFunction$0$anonymous"], process.env["ENCRYPTION_KEY"]));
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
