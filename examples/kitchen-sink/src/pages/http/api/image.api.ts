import sharp from "sharp";

export async function GET() {
  let image = await sharp({
    text: {
      height: 300,
      width: 400,
      text: '<span foreground="red">Two</span><span background="red" color="white">fold</span>',
      font: "sans",
      rgba: true,
    },
  })
    .png()
    .toBuffer();

  return new Response(image, {
    headers: {
      "content-type": "image/png",
    },
  });
}
