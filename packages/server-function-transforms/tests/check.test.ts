import { expect, test, describe } from "vitest";
import { check } from "../src/index.js";
import dedent from "dedent";

describe("transforms", () => {
  test("it should return false for a file without server functions", async () => {
    let code = dedent`
      export async function Page() {
        return <div>Hello World</div>;
      }
    `;

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(false);
  });

  test("it should return true for a file with a 'use server' function defined in module scope", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for multiple 'use server' functions defined in module scope", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for a 'use server' function defined in a function expression", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for a 'use server' function defined in an arrow function", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for a 'use server' function defined in an object method", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for a 'use server' function defined in a component", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for an anonymous 'use server' function defined in a component", async () => {
    let code = dedent`
      let count = 0;
        
      export default function Page() {
        return <form action={() => {
          "use server";
          count = count + 1;
        }} />;
      }
    `;

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for an anonymous 'use server' function used in an array", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });

  test("it should return true for a factory function", async () => {
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

    let result = await check({
      input: {
        code,
        language: "jsx",
      },
      moduleId: "test",
    });

    expect(result).toBe(true);
  });
});
