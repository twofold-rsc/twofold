import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "warn",
  },
  plugins: ["typescript", "react"],
  rules: {
    "react/react-compiler": "error",
  },
});
