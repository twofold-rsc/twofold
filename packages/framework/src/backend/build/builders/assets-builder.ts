import { copyFile, mkdir } from "fs/promises";
import { appCompiledDir } from "../../files.js";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";
import { createBrotliCompress } from "zlib";
import { basename } from "path";
import { pathToFileURL } from "url";

type Asset = {
  id: string;
  type: string;
  assetPath: string;
  brotliPath?: string;
};

export class AssetsBuilder extends Builder {
  readonly name = "assets";

  #build: Build;
  #assetMap: Map<string, Asset> = new Map();

  constructor({ build }: { build: Build }) {
    super();
    this.#build = build;
  }

  get assetMap() {
    return this.#assetMap;
  }

  get #assetDir() {
    return new URL("./assets/", appCompiledDir);
  }

  async setup() {
    let dirs = ["styles", "images", "fonts", "chunks", "entries"];
    if (this.#build.name === "production") {
      await mkdir(this.#assetDir, { recursive: true });
      await Promise.all(
        dirs.map((dir) => mkdir(new URL(`./${dir}`, this.#assetDir))),
      );
    }
  }

  async build() {
    let build = this.#build;
    let rscCss = this.#build.getBuilder("rsc").css;
    let clientAppChunks = this.#build.getBuilder("client").chunks;
    let clientAppEntries = [
      ...Object.values(
        this.#build.getBuilder("client").clientComponentModuleMap,
      ).map((c) => c.path),
      this.#build.getBuilder("client").bootstrapPath,
    ];
    let images = [
      ...build.getBuilder("rsc").imagesMap.values(),
      ...build.getBuilder("client").imagesMap.values(),
    ];
    let fonts = [...build.getBuilder("rsc").fontsMap.values()];

    async function createAsset(id: string, fromUrl: URL) {
      if (build.name === "production") {
        let toUrl = new URL(`./assets/${id}`, appCompiledDir);
        await copyFile(fromUrl, toUrl);
        return toUrl;
      } else {
        return fromUrl;
      }
    }

    async function compress(url: URL) {
      if (build.name === "production") {
        const brotliUrl = new URL(`${url.href}.br`, appCompiledDir);
        await pipeline(
          createReadStream(url),
          createBrotliCompress(),
          createWriteStream(brotliUrl),
        );
        return brotliUrl;
      }
    }

    let rscCssPromises = rscCss.map(async (rscCssFilename) => {
      let fromUrl = new URL(`./rsc/css/${rscCssFilename}`, appCompiledDir);
      let id = `styles/${rscCssFilename}`;
      let assetUrl = await createAsset(id, fromUrl);
      let brotliUrl = await compress(assetUrl);

      return {
        id,
        type: "text/css",
        assetPath: assetUrl.pathname,
        brotliPath: brotliUrl?.pathname,
      };
    });

    let clientEntryPromises = clientAppEntries.map(
      async (clientAppEntryPath) => {
        let fromUrl = pathToFileURL(clientAppEntryPath);
        let name = basename(clientAppEntryPath);

        let id = `entries/${name}`;
        let assetUrl = await createAsset(id, fromUrl);
        let brotliUrl = await compress(assetUrl);

        return {
          id,
          type: "text/javascript",
          assetPath: assetUrl.pathname,
          brotliPath: brotliUrl?.pathname,
        };
      },
    );

    let clientChunkPromises = clientAppChunks.map(async (chunk) => {
      let fromUrl = pathToFileURL(chunk.path);

      let id = `chunks/${chunk.file}`;
      let assetUrl = await createAsset(id, fromUrl);
      let brotliUrl = await compress(assetUrl);

      return {
        id,
        type: "text/javascript",
        assetPath: assetUrl.pathname,
        brotliPath: brotliUrl?.pathname,
      };
    });

    let imagePromises = images.map(async (image) => {
      let fromUrl = pathToFileURL(image.path);
      let id = `images/${image.id}`;
      let assetUrl = await createAsset(id, fromUrl);

      return {
        id,
        type: image.type,
        assetPath: assetUrl.pathname,
      };
    });

    let fontPromises = fonts.map(async (font) => {
      let fromUrl = pathToFileURL(font.path);
      let id = `fonts/${font.id}`;
      let assetUrl = await createAsset(id, fromUrl);

      return {
        id,
        type: font.type,
        assetPath: assetUrl.pathname,
      };
    });

    let assets = await Promise.all([
      ...rscCssPromises,
      ...clientEntryPromises,
      ...clientChunkPromises,
      ...imagePromises,
      ...fontPromises,
    ]);

    let assetMap = assets.reduce((map, asset) => {
      map.set(asset.id, asset);
      return map;
    }, new Map<string, Asset>());

    this.#assetMap = assetMap;
  }

  async stop() {}

  serialize() {
    return {
      assetMap: Object.fromEntries(this.#assetMap.entries()),
    };
  }

  load(data: any) {
    if (data.assetMap) {
      this.#assetMap = new Map(Object.entries(data.assetMap));
    }
  }

  warm() {}
}
