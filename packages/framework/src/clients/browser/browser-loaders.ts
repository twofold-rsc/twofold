const moduleMap = new Map<string, unknown>();

interface Window {
  __webpack_chunk_load__: (id: string) => Promise<any>;
  __webpack_require__: (id: string) => any;
  $Framework$reloadChunk: (chunk: string) => Promise<any>;
}

window.__webpack_chunk_load__ = async function (chunkId) {
  let [moduleId, name, browserHash] = chunkId.split(":");
  let modulePath = `/_assets/browser-app/${name}-${browserHash}.js`;
  let mod = await import(modulePath);
  moduleMap.set(moduleId, mod);
  return mod;
};

window.$Framework$reloadChunk = async function (chunk) {
  let [moduleId, name, browserHash] = chunk.split(":");
  let modulePath = `/_assets/browser-app/${name}-${browserHash}.js?v=${Date.now()}}`;
  let mod = await import(modulePath);
  moduleMap.set(moduleId, mod);
  return mod;
};

window.__webpack_require__ = function (id) {
  let [moduleId, exportName] = id.split("#");
  // console.log("browser require", id);
  return moduleMap.get(moduleId);
};
