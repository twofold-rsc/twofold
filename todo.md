# TODO

- dont use uuid for server action ids
- toast component add link to docs
- endpoints (rss)

- test
- release

- blog rss: https://bsky.app/profile/sebastienlorber.com/post/3lnxq4yqids2a
- when blog traffic dies down, take a look at cloud cdn configuration
- billing

- blog index seo
- newsletter signup

- docs for pathless layouts
- public folder + docs

- ink
- create twofold app initial output
- show version
- show twofold version
- add npm

- cli generate secret key
- cli docs

- pages & layouts can "use client";

- scroll position when going back
- get rid of assets (instead importing a css file should give the url)

- api routes should use route matchers

- components
- SubmitButton?
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
- only allow function exports from server modules. you dont want to import a non function call server on the client

- website for server-function-transforms

website

- Loading screens
- Error handling

- One app
- Server, client, server

- mobile menu

- docs md files should use <Link>

framework

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
