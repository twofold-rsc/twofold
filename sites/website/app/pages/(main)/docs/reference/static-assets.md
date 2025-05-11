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
