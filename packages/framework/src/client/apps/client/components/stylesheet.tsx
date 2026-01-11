/*
  Using precedence does not unload the stylesheet when the
  <link> is un-rendered. This component takes care of loading and _unloading_
  stylesheets in a suspense-friendly way.
*/
import { use, useInsertionEffect } from "react";

function load(href: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window !== "undefined") {
      let link = document.createElement("link");
      let head = document.getElementsByTagName("head")[0];

      if (head) {
        link.href = href;
        link.onload = () => resolve();
        link.onerror = reject;
        link.rel = "stylesheet";

        head.appendChild(link);
      } else {
        reject(new Error("No <head> element found"));
      }
    } else {
      resolve();
    }
  });
}

let cache = new Map<string, ReturnType<typeof load>>();

export function Stylesheet({ href }: { href: string }) {
  if (!cache.has(href)) {
    cache.set(href, load(href));
  }

  let promise = cache.get(href);
  if (!promise) {
    throw new Error("Could not load stylesheet");
  }

  use(promise);

  useInsertionEffect(() => {
    let head = document.getElementsByTagName("head")[0];
    let shouldAdd = true;

    let links = document.getElementsByTagName("link");
    for (let i = 0; i < links.length; i++) {
      let link = links[i];
      if (link && link.getAttribute("href") === href) {
        shouldAdd = false;
      }
    }

    if (shouldAdd && head) {
      let link = document.createElement("link");
      link.href = href;
      link.rel = "stylesheet";
      head.appendChild(link);
    }

    return () => {
      let links = document.getElementsByTagName("link");
      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        if (link && link.getAttribute("href") === href) {
          link.disabled = true;
          link.parentNode?.removeChild(link);
        }
      }
    };
  }, [href]);

  return null;
}
