# Static assets

Use static assets to serve images, fonts, and other public files from your Twofold app.

## Public folder

Files placed in the `/public` folder are served at the root of your app. For example, a file at `public/logo.png` will be available at `https://example.com/logo.png`.

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

Images are importable by any component in your app. Importing an image will give a URL to use in `src` or `href` attributes.

```tsx
// app/pages/index.page.tsx

import picture from "picture.png";

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

import picture from "picture.png";
import { PageProps } from "@twofold/framework/types";

export default function IndexPage({ request }: PageProps) {
  const url = new URL(request.url);
  const absolutePictureUrl = new URL(picture, url.origin);

  return (
    <div>
      <img src={absolutePictureUrl} />
    </div>
  );
}
```
