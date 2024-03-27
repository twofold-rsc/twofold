interface Window {
  __webpack_chunk_load__: (id: string) => Promise<any>;
  __webpack_require__: (id: string) => any;
  $Framework$reloadChunk: (chunk: string) => Promise<any>;
}

if (typeof window !== "undefined") {
  let moduleMap = new Map<string, unknown>();

  if (!window.__webpack_chunk_load__) {
    window.__webpack_chunk_load__ = async function (chunkId) {
      let [moduleId, name, hash] = chunkId.split(":");
      let modulePath = `/_assets/client-app/${name}-${hash}.js`;
      let mod = moduleMap.get(moduleId);
      if (!mod) {
        // only import modules we don't know about
        mod = await import(modulePath);
        moduleMap.set(moduleId, mod);
      }
      return mod;
    };
  }

  if (!window.$Framework$reloadChunk) {
    window.$Framework$reloadChunk = async function (chunk) {
      let [moduleId, name, hash] = chunk.split(":");
      let modulePath = `/_assets/client-app/${name}-${hash}.js?v=${Date.now()}`;
      let mod = await import(modulePath);
      moduleMap.set(moduleId, mod);
      return mod;
    };
  }

  if (!window.__webpack_require__) {
    window.__webpack_require__ = function (id) {
      let [moduleId, exportName] = id.split("#");
      // console.log("browser require", id);
      return moduleMap.get(moduleId);
    };
  }
}
