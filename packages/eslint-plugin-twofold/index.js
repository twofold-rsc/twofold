module.exports = {
  meta: {
    name: "eslint-plugin-twofold",
  },
  configs: {
    recommended: {
      env: {
        browser: true,
        es2021: true,
        node: true,
      },
      extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:react/jsx-runtime",
      ],
      overrides: [
        {
          files: [".eslintrc.json"],
        },
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      plugins: ["@typescript-eslint", "react"],
      rules: {
        "no-unused-vars": ["off", { args: "none", varsIgnorePattern: "^_" }],
        "react/no-unescaped-entities": [
          "error",
          {
            forbid: [
              {
                char: ">",
                alternatives: ["&gt;"],
              },
              {
                char: "}",
                alternatives: ["&#125;"],
              },
            ],
          },
        ],
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
  },
};
