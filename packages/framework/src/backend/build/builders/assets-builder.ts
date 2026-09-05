import { createReadStream, createWriteStream } from "fs";
import { copyFile, mkdir } from "fs/promises";
import { basename } from "path";
import { pipeline } from "stream/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { createBrotliCompress } from "zlib";
import { appCompiledDir } from "../../files.js";
import { Builder } from "./builder.js";
import type { ClientOutput } from "./client-builder.js";
import type { RSCOutput } from "./rsc-builder.js";

export type AssetsBuilderInput = {
  readonly environment: "development" | "production";
  readonly rsc: RSCOutput;
  readonly client: ClientOutput;
};

type Asset = {
  readonly id: string;
  readonly type: string;
  readonly assetPath: string;
  readonly brotliPath?: string | undefined;
};

export class AssetsBuilder extends Builder<AssetsBuilderInput, AssetsOutput> {
  async build({ environment, rsc, client }: AssetsBuilderInput) {
    let assetDir = new URL("./assets/", appCompiledDir);

    if (environment === "production") {
      let dirs = ["styles", "images", "fonts", "chunks", "entries"];
      await mkdir(assetDir, { recursive: true });
      await Promise.all(
        dirs.map((dir) =>
          mkdir(new URL(`./${dir}`, assetDir), { recursive: true }),
        ),
      );
    }

    let clientAppEntries = [
      ...Object.values(client.clientComponentModuleMap).map(
        (component) => component.path,
      ),
      client.bootstrapPath,
    ];
    let images = [...rsc.imagesMap.values(), ...client.imagesMap.values()];
    let fonts = [...rsc.fontsMap.values()];

    async function createAsset(id: string, fromUrl: URL) {
      if (environment === "production") {
        let toUrl = new URL(`./assets/${id}`, appCompiledDir);
        await copyFile(fromUrl, toUrl);
        return toUrl;
      }

      return fromUrl;
    }

    async function compress(url: URL) {
      if (environment === "production") {
        let brotliUrl = new URL(`${url.href}.br`, appCompiledDir);
        await pipeline(
          createReadStream(url),
          createBrotliCompress(),
          createWriteStream(brotliUrl),
        );
        return brotliUrl;
      }
    }

    let rscCssPromises = rsc.css.map(async (rscCssFilename) => {
      let fromUrl = new URL(`./rsc/css/${rscCssFilename}`, appCompiledDir);
      let id = `styles/${rscCssFilename}`;
      let assetUrl = await createAsset(id, fromUrl);
      let brotliUrl = await compress(assetUrl);

      return {
        id,
        type: "text/css",
        assetPath: fileURLToPath(assetUrl),
        brotliPath: brotliUrl ? fileURLToPath(brotliUrl) : undefined,
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
          assetPath: fileURLToPath(assetUrl),
          brotliPath: brotliUrl ? fileURLToPath(brotliUrl) : undefined,
        };
      },
    );

    let clientChunkPromises = client.chunks.map(async (chunk) => {
      let fromUrl = pathToFileURL(chunk.path);
      let id = `chunks/${chunk.file}`;
      let assetUrl = await createAsset(id, fromUrl);
      let brotliUrl = await compress(assetUrl);

      return {
        id,
        type: "text/javascript",
        assetPath: fileURLToPath(assetUrl),
        brotliPath: brotliUrl ? fileURLToPath(brotliUrl) : undefined,
      };
    });

    let imagePromises = images.map(async (image) => {
      let fromUrl = pathToFileURL(image.path);
      let id = `images/${image.id}`;
      let assetUrl = await createAsset(id, fromUrl);

      return {
        id,
        type: image.type,
        assetPath: fileURLToPath(assetUrl),
      };
    });

    let fontPromises = fonts.map(async (font) => {
      let fromUrl = pathToFileURL(font.path);
      let id = `fonts/${font.id}`;
      let assetUrl = await createAsset(id, fromUrl);

      return {
        id,
        type: font.type,
        assetPath: fileURLToPath(assetUrl),
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

    return new AssetsOutput(assetMap);
  }

  load(data: ReturnType<AssetsOutput["serialize"]>) {
    return new AssetsOutput(new Map(Object.entries(data.assetMap)));
  }
}

export class AssetsOutput {
  readonly assetMap: ReadonlyMap<string, Asset>;

  constructor(assetMap: ReadonlyMap<string, Asset>) {
    this.assetMap = assetMap;
  }

  serialize() {
    return {
      assetMap: Object.fromEntries(this.assetMap.entries()),
    };
  }

  warm() {}
}
