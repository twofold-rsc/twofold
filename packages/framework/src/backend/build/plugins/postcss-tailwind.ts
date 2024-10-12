import { Plugin } from "esbuild";
import * as postcssrc from "postcss-load-config";
import postcss from "postcss";
import { readFile } from "fs/promises";

export function postcssTailwind() {
  let plugin: Plugin = {
    name: "postcss",
    async setup(build) {
      let postcssConfig: postcssrc.Result | false;

      // @ts-expect-error: Property 'default' does not exist on type '(ctx?: ConfigContext | undefined, path?: string | undefined, options?: Options | undefined) => Promise<Result>'.
      postcssConfig = await postcssrc.default();
      build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
        let css = await readFile(path, "utf8");

        if (!postcssConfig) {
          return { contents: css, loader: "css" };
        }

        let result = await postcss(postcssConfig.plugins).process(css, {
          ...postcssConfig.options,
          from: path,
        });

        return {
          contents: result.css,
          loader: "css",
        };
      });
    },
  };

  return plugin;
}
