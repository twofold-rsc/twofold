import { expect, test, describe } from "vitest";
import { check } from "../src/index.js";
import dedent from "dedent";

describe("check", () => {
  test("it should return true for a module without 'use client'", async () => {
    let code = dedent`
      "use client";

      export function Title() {
        return <div>A title tag</div>;
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

  test("it should return false for a module without 'use client'", async () => {
    let code = dedent`
      export function Title() {
        return <div>A title tag</div>;
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

  test("it should return false for a module that has 'use client', but not as a directive", async () => {
    let code = dedent`
      export function Title() {
        "use client";
        return <div>A title tag</div>;
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
});
