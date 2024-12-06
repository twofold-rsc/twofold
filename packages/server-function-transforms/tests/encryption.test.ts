import { expect, test, describe } from "vitest";
import dedent from "dedent";
import { transform } from "../src/index";
import { encrypt, decrypt } from "../src/index";
import { envKey } from "../src/index";

describe("encryption", () => {
  test("it should be able to encrypt and decrypt text", async () => {
    let password = "password123";
    let encrypted = await encrypt("Hello world!", password);
    let decrypted = await decrypt(encrypted, password);

    expect(encrypted).not.toBe("Hello world!");
    expect(decrypted).toBe("Hello world!");
  });

  test("it should fail if the encryption key is incorrect", async () => {
    let encrypted = await encrypt("Hello world!", "abc123");

    await expect(async () => {
      await decrypt(encrypted, "xyz456");
    }).rejects.toThrowError(/The operation failed/);
  });

  test("it should not produce the same output for the same input", async () => {
    let password = "password123";
    let encrypted1 = await encrypt("Hello world!", password);
    let encrypted2 = await encrypt("Hello world!", password);

    expect(encrypted1).not.toBe(encrypted2);
  });
});

describe("encrypted captured variables", () => {
  test("it should encrypt and decrypt captured variables", async () => {
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
      'import { encrypt, decrypt } from "@twofold/server-function-transforms";',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt, decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      async function tf$serverFunction$0$greet(tf$encrypted$name) {
        "use server";

        let name = decrypt(tf$encrypted$name, process.env["ENCRYPTION_KEY"]);
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, encrypt(name, process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });

  test.todo(
    "it should assert that the encryption password is a valid string",
    async () => {},
  );

  test.only("it should allow for a custom module to control encryption", async () => {
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
      'import { encrypt, decrypt } from "some/other/encrypt/module";',
    );

    expect(result.code).toMatchInlineSnapshot(`
      "import { encrypt, decrypt } from "some/other/encrypt/module";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      async function tf$serverFunction$0$greet(tf$encrypted$name) {
        "use server";

        let name = decrypt(tf$encrypted$name, process.env["ENCRYPTION_KEY"]);
        console.log("hello", name);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        const greet = tf$serverFunction$0$greet.bind(null, encrypt(name, process.env["ENCRYPTION_KEY"]));
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
      "import { encrypt, decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      async function tf$serverFunction$0$greet(tf$encrypted$name, tf$encrypted$other) {
        "use server";

        let other = decrypt(tf$encrypted$other, process.env["ENCRYPTION_KEY"]);
        let name = decrypt(tf$encrypted$name, process.env["ENCRYPTION_KEY"]);
        console.log("hello", name, other);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let other = 123;
        const greet = tf$serverFunction$0$greet.bind(null, encrypt(name, process.env["ENCRYPTION_KEY"]), encrypt(other, process.env["ENCRYPTION_KEY"]));
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
      "import { encrypt, decrypt } from "@twofold/server-function-transforms";
      import { registerServerReference } from "react-server-dom-webpack/server.edge";
      import { jsx } from "react/jsx-runtime";
      async function tf$serverFunction$0$greet(tf$encrypted$name, other2) {
        "use server";

        let name = decrypt(tf$encrypted$name, process.env["ENCRYPTION_KEY"]);
        console.log("hello", name, other2);
      }
      registerServerReference(tf$serverFunction$0$greet, "test", "tf$serverFunction$0$greet");
      function Page({
        name
      }) {
        let other = 123;
        const greet = tf$serverFunction$0$greet.bind(null, encrypt(name, process.env["ENCRYPTION_KEY"]));
        return /* @__PURE__ */jsx("form", {
          action: greet.bind(null, other)
        });
      }
      export { Page as default };
      export { tf$serverFunction$0$greet };"
    `);
  });
});
