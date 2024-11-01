# Styling

Twofold uses [Tailwind CSS](https://tailwindcss.com/) for a simple and constrained styling approach.

## Tailwind CSS

A default Tailwind configuration is included in the root of your project. It is configured to scan the `src` directory for any utility classes when building.

You can change the default configuration by editing the `tailwind.config.js` file.

## Global styles

You can add global CSS to your project by editing the `src/pages/global.css` file. This file will be imported by your root layout.

## Page specific styles

Pages are allowed to import their own CSS files that will only be loaded when the page is visited.

```css
/* src/pages/posts/styles.css */

.posts {
  background-color: blue;
}
```

```tsx
// src/pages/posts/index.page.tsx

import "./styles.css";

export default function PostsPage() {
  return <div className="posts">This page is blue</div>;
}
```

The posts page will render with a blue background. When visited Twofold will delay rendering the page until the CSS file has been loaded.

Twofold only allows CSS files to be imported in Layout and Page components. These CSS files will be loaded when a user visits the page, but they are not guaranteed to by unloaded when the user navigates away from the page. It is important to scope your CSS to the page to prevent conflicts with other pages.

Although Twofold supports page specific CSS files, it is recommended to stick with the utility classes from Tailwind CSS for styling your components.
