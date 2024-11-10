import { fileURLToPath } from "url";
import { dirname } from "path";

let __filename = fileURLToPath(import.meta.url);
let __dirname = dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [`${__dirname}/**/*.{ts,tsx}`],
  theme: {
    extend: {},
  },
  plugins: [],
};
