# TODO

blog post todo:

- note about pretty ignore
- up max stroke width range
- style playground text / values
- add config to playground
- test ios / use 2nd context

- make sure other blog posts still work
- clean up code
- make sure other blog posts still work
- put package in monorepo
- make sure other blog posts still work
- publish to npm
- test cases / vitest
- build test app

- og image
- page speed on blog post (i think were missing meta description)
- setup search console

- add gzip/brotli support to the build
- run posts through page speed

- safari looks for /apple-touch-icon-precomposed.png, /apple-touch-icon.png

- run routes in parallel
- add cache support to the build, explore rolldown
- error handling

- blog index seo
- newsletter signup (after 3 posts)

- docs for pathless layouts

- rework build/startup
- let externals plugin use the cache

- add URL(request.url) to PageProps

- Run through windows

- ink
- create twofold app initial output
- show version
- show twofold version

- cli generate secret key (openssl rand -base64 32)
- cli docs
- docker/deploy should use cli-command

- pages & layouts can "use client";

- api routes should use route matchers

- components
- NavigationLink

- error handling: if an RSC errors we should still capture and serialize the error into the stream so that it can be handled by the client app.

- prefix encrypted cookie with app name

- taint secret key (needs experimental react)
- editing env file should trigger some sort of change so live reload works
- editing config file should trigger reload
- if build changes (stale browser, whatever) should live reload
- production build should live reload in dev. live reload is really about the task, not the build environment

- perf tracking: https://github.com/facebook/react/pull/31729

- live reload should reconnect when disconnected

- rename api handlers
- only allow async function exports from server modules. you dont want to import a non function call server on the client

- website for server-function-transforms

website

- Loading screens
- Error handling

- One app
- Server, client, server

- mobile menu

- docs md files should use <Link>

framework

- pg-lite + pg+gateway: https://github.com/supabase-community/pg-gateway

- not found and redirect should be server only
- put all error boundaries in same client component
- monkey patch console.error for not found/redirect boundaries

- run middleware in RSC?

- reload on file changes under pages? (ex editing an md file)

- bug: visit route, rename file, build error

- bug: back cache not working when error thrown
  go to server action throws error, trigger, then click back

- custom error page for prod (errors/500.html)

- RSC toast: save RSC in db, and set a cookie with the row id. then clients cant read from it during SSR

create twofold app

- show version

kitchen sink

- loading screens
- dynamic segments as folders

- restart client builder if entries change
- restart rsc builder if entries change
- taint examples

- Playwright
- Form

- it looks like you can render the app and get the action result like this:
  1. https://github.com/facebook/react/blob/850fac4915864a487e7cb9ecae8a75dbac144174/fixtures/flight/server/region.js#L154
  2. https://github.com/facebook/react/blob/850fac4915864a487e7cb9ecae8a75dbac144174/fixtures/flight/src/index.js#L19

## Client Components

- [ ] SSR should preloadmodule

## Routing

- [ ] don't allow two dynamic routes with the same dynamic identifier ($id)

## Build

- Adding many files (unzip something)
- create runnable bundles for RSC/SSR
- check if middleware export default is a function
- image imports (rsc, client)

## Static files

- Redirect to static file
- Static files should come first in routing checks
- Rebuild static files when dir changes
- Prod static files should move into build dir?

## Global middleware

- hasMiddleware shouldn't check for ts file (should look for compiled entry point)

## Create twofold app

- Ability to install pre-released version of twofold/framework

## HMR

- find the file that changed, if all capital then trigger refresh otherwise reload window
- Read this: https://bjornlu.com/blog/hot-module-replacement-is-easy#importmetahotaccept

## Postgres

- https://github.com/Olshansk/postgres_for_everything?tab=readme-ov-file

## Errors

- Don't allow setting cookies during render (or after first chunk flush)

## Goals

- https://twitter.com/igarcido/status/1711450565396332800
- Trello
- Draw
- Photo gallery nested layouts

## Design

- https://twitter.com/jh3yy/status/1712881626969997355
- https://craftofui.substack.com/p/muddling-your-words?triedRedirect=true
- https://news.ycombinator.com/item?id=42537567

```tsx
// client component map for rsc server render
{
  "link-63a8b9c9cd59152bb0931307b8e22426#default": {
    id: "link-63a8b9c9cd59152bb0931307b8e22426#default",
    chunks: [
      "link-63a8b9c9cd59152bb0931307b8e22426:entries/link:KM6HTJ3G",
      "/entries/link-KM6HTJ3G.js",
    ],
    name: "default",
  },
},
```

```tsx
// create from readable stream
let x = createFromReadableStream(t1, {
  ssrManifest: {
    moduleMap: {
      "link-63a8b9c9cd59152bb0931307b8e22426#default": {
        default: {
          id: "link-63a8b9c9cd59152bb0931307b8e22426#default",
          chunks: [
            "link-63a8b9c9cd59152bb0931307b8e22426:entries/link:KM6HTJ3G",
            "/entries/link-KM6HTJ3G.js",
          ],
          name: "default",
        },
      },
    },
    moduleLoading: {
      prefix: "/",
    },
  },
});

console.log(Array.from(x._response._chunks.values()).map((p) => p.status));
```
