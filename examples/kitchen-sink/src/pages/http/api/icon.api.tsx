import sharp from "sharp";
import { MapPinIcon } from "@heroicons/react/20/solid";
import { renderStaticHtml } from "@twofold/framework/render";

export async function GET() {
  let svg = await renderStaticHtml(
    <MapPinIcon
      style={{
        height: 64,
        width: 64,
        color: "blue",
      }}
    />,
  );

  let image = await sharp(Buffer.from(svg), {
    density: 72,
  })
    .png()
    .toBuffer();

  return new Response(image, {
    headers: {
      "content-type": "image/png",
    },
  });
}
