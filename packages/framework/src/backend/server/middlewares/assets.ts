import { RouteHandler, createRouter } from "@hattip/router";
import { appCompiledDir } from "../../files.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { Environment } from "../../build/environments/environment.js";

export function assets(build: Environment): RouteHandler {
  let router = createRouter();

  router.get("/_assets/client-app/bootstrap/:hash.js", async () => {
    let modulePath = build.getBuilder("client").bootstrapPath;
    let contents = await readFile(modulePath, "utf-8");

    return new Response(contents, {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  });

  router.get(
    "/_assets/client-app/chunks/chunk-:hash.js",
    async ({ params }) => {
      let { hash } = params as unknown as { hash: string };
      let chunk = build
        .getBuilder("client")
        .chunks.find((chunk) => chunk.hash === hash);

      if (chunk) {
        let contents = await readFile(chunk.path, "utf-8");

        return new Response(contents, {
          headers: {
            "Content-Type": "application/javascript",
          },
        });
      }
    }
  );

  router.get(
    "/_assets/client-app/entries/:name-:hash.js",
    async ({ params }) => {
      let { name, hash } = params as unknown as { name: string; hash: string };

      let entriesUrl = new URL("./client-app/entries/", appCompiledDir);
      let fileUrl = new URL(`${name}-${hash}.js`, entriesUrl);
      let filePath = fileURLToPath(fileUrl);

      let clientComponentModuleMap =
        build.getBuilder("client").clientComponentModuleMap;

      // crappy O(n) lookup, change this
      let keys = Object.keys(clientComponentModuleMap);
      let moduleKey = keys.find(
        (key) => clientComponentModuleMap[key].path === filePath
      );
      let module = moduleKey ? clientComponentModuleMap[moduleKey] : null;

      if (module && module.path) {
        let contents = await readFile(module.path, "utf-8");

        return new Response(contents, {
          headers: {
            "Content-Type": "application/javascript",
          },
        });
      }
    }
  );

  router.get("/_assets/styles/**/*", async ({ request }) => {
    let { pathname } = new URL(request.url);

    let cssPath = pathname.replace(/^\/_assets\/styles\//, "");
    let knownFile = build.getBuilder("rsc").css.includes(cssPath);

    if (knownFile) {
      let cssUrl = new URL("./rsc/css/", appCompiledDir);
      let fileUrl = new URL(cssPath, cssUrl);
      let contents = await readFile(fileUrl, "utf-8");
      return new Response(contents, {
        headers: {
          "Content-Type": "text/css",
        },
      });
    }
  });

  let handler = router.buildHandler();

  return async (ctx) => {
    let passThroughCalled = false;

    let subContext = {
      ...ctx,
      passThrough: async () => {
        passThroughCalled = true;
      },
    };

    let response = await handler(subContext);

    return response.status === 404 && passThroughCalled ? ctx.next() : response;
  };
}
