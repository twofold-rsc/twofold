# Static assets

Use static assets to serve images, fonts, and other public files from your Twofold app.

## Public folder

Files placed in the `/public` folder are served at the root of your app. For example, the file `public/logo.png` will be available at `https://example.com/logo.png`.

```text
├─ app
|  └─ pages
│     ├─ index.page.tsx
|     └─ about.page.tsx
└─ public
   ├─ logo.png
   ├─ robots.txt
   └─ favicon.ico
```

## Images

Images are importable by any component in your app. Importing an image will give a URL that's usable in `src` or `href` attributes.

```tsx
// app/pages/index.page.tsx

import picture from "./picture.png";

export default function IndexPage() {
  return (
    <div>
      <img src={picture} />
    </div>
  );
}
```

All imported images are automatically hashed and given a unique URL. This makes imported images cacheable and ensures that the browser always loads the latest version of the image.

### Absolute image URLs

Imported images use relative URLs. If you need an absolute URL, you can use the request's `url` property like so:

```tsx
// app/pages/index.page.tsx

import picture from "./picture.png";
import { PageProps } from "@twofold/framework/types";

export default function IndexPage({ request }: PageProps) {
  const url = new URL(request.url);
  const absolutePictureUrl = new URL(picture, url.origin);

  return (
    <div>
      <img src={absolutePictureUrl.href} />
    </div>
  );
}
```

## Fonts

Fonts can be used by any CSS file or component in your app. Importing a font will give a URL that's usable by `@font-face` declarations as well as preload link tags.

To reference a font in CSS, use the `url()` function with the path to the font file.

```css
@font-face {
  font-family: "MyFont";
  src: url("/fonts/my-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
}

body {
  font-family: "MyFont", sans-serif;
}
```

In this example, the `my-font.woff2` file should be located in the `/public/fonts` directory.

### Preloading fonts

To preload a font, you can use a `<link rel="preload">` tag in any component.

```tsx
import MyFont from "@/public/fonts/my-font.woff2";

export default function Page() {
  return (
    <>
      <link
        rel="preload"
        href={MyFont}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}
```
