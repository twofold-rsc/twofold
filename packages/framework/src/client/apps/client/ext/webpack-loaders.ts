interface Window {
  __webpack_chunk_load__: (id: string) => Promise<any>;
  __webpack_require__: (id: string) => any;
  __webpack_get_script_filename__: (id: string) => string;
  __twofold__chunk_reload__: (chunk: string) => Promise<any>;
}

if (typeof window !== "undefined") {
  let moduleMap = new Map<string, unknown>();

  if (!window.__webpack_chunk_load__) {
    window.__webpack_chunk_load__ = async function (chunkId) {
      let [moduleId, name, hash] = chunkId.split(":");
      if (!moduleId) {
        throw new Error("Invalid chunk id");
      }
      let modulePath = `/__tf/assets/${name}-${hash}.js`;
      let mod = moduleMap.get(moduleId);
      if (!mod) {
        // only import modules we don't know about
        mod = await import(modulePath);
        moduleMap.set(moduleId, mod);
      }
      return mod;
    };
  }

  if (!window.__twofold__chunk_reload__) {
    window.__twofold__chunk_reload__ = async function (chunk) {
      let [moduleId, name, hash] = chunk.split(":");
      if (!moduleId) {
        throw new Error("Invalid chunk id");
      }
      let modulePath = `/__tf/assets/${name}-${hash}.js?v=${Date.now()}`;
      let mod = await import(modulePath);
      moduleMap.set(moduleId, mod);
      return mod;
    };
  }

  if (!window.__webpack_require__) {
    window.__webpack_require__ = function (id) {
      let [moduleId] = id.split("#");
      if (!moduleId) {
        throw new Error("Invalid id");
      }
      // console.log("browser require", id);
      return moduleMap.get(moduleId);
    };
  }

  if (!window.__webpack_get_script_filename__) {
    window.__webpack_get_script_filename__ = function (id) {
      let [, name, hash] = id.split(":");
      let filename = `${window.location.origin}/__tf/assets/${name}-${hash}.js`;
      return filename;
    };
  }
}
