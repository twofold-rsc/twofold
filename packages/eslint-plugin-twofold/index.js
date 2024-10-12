let eslintPluginReact = require("eslint-plugin-react");
let eslintPluginReactHooks = require("eslint-plugin-react-hooks");
let globals = require("globals");
let fs = require('fs');
let path = require('path');

let packageJsonPath = path.join(__dirname, 'package.json');
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let version = packageJson.version;

let plugin = {
  meta: {
    name: "eslint-plugin-twofold",
    version
  },
  configs: {
    recommended: [
      {
        ignores: [".twofold/"],
      },
      {
        files: ["**/*.{js,ts,jsx,tsx}"],
        languageOptions: {
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
          globals: {
            ...globals.browser,
            ...globals.node,
          },
        },
        plugins: {
          react: eslintPluginReact,
          "react-hooks": eslintPluginReactHooks,
        },
        rules: {
          ...eslintPluginReactHooks.configs.recommended.rules,
        },
      }
    ]
  },
  rules: {},
  processors: {}
};

module.exports = plugin;
