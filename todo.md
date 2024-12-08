# TODO

framework

- create app w/ secrets
- sessions

- rename src to app, add /app/components
- dont auto bundle (maybe only bundle things that depend on react?)

- README
- taint secret key
- website

- server action modules
- long cache headers for production

- (layout) routing

- support server actions from node_modules, see the esbuild server-actions-plugin used by rsc builder.

- tailwind v4
- editing env file should trigger some sort of change so live reload works
- editing config file should trigger reload
- if build changes (stale browser, whatever) we should live reload
- production build should live reload in dev. live reload is really about the task, not the build environment

- errors when editing files + SSE closing

- rename src to app
- add /app/components?

- live reload should reconnect when disconnected
- add --log=debug flag to show debug logs
- tailwind v4/lightening css

- rename api handlers
- only allow function exports from server modules. you dont want to import a non function call server on the client

- eslints
- https://bsky.app/profile/tkdodo.eu/post/3lbn55t5d5s24
- https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect

website

- Routing + Pages & Layouts to reference
- Loading screens
- Error handling
- Deploying

- One app
- Server, client, server

- mobile menu

- line length in md files
- setup website with eslint, tailwind prettier
- docs md files should use <Link>

framework

- not found and redirect should be server only
- put all error boundaries in same client component
- monkey patch console.error for not found/redirect boundaries

- run middleware in RSC

- sessions

- reload on file changes under pages? (ex editing an md file)

- bug: visit route, rename file, build error

- bug: back cache not working when error thrown
  go to server action throws error, trigger, then click back

- does rsdw need to be an external?
- bundle rsdw

- custom error page for prod (errors/500.html)

create twofold app

- show version

kitchen sink

- loading screens
- dynamic segments as folders

- action on page with blocking suspense
- refresh a blocking suspense page
- click link to page that suspends, then router.refresh before it loads
- restart client builder if entries change
- restart rsc builder if entries change
- taint examples

- Externals for RSC build (inc react)
  https://github.com/LinbuduLab/esbuild-plugins/tree/main/packages/esbuild-plugin-node-externals

Playwright
Form

- it looks like you can render the app and get the action result like this:
  1. https://github.com/facebook/react/blob/850fac4915864a487e7cb9ecae8a75dbac144174/fixtures/flight/server/region.js#L154
  2. https://github.com/facebook/react/blob/850fac4915864a487e7cb9ecae8a75dbac144174/fixtures/flight/src/index.js#L19

## Actions

- [x] Action from RSC
- [x] Actions / mutate state on server
- [x] Action takes form data
- [x] Action takes primitive
- [x] Action passes data into next render
- [x] Action imported into client component from 'use server' file
- [x] Action imported into server component from 'use server' file
- [ ] Action defined in render (closure variables)

- [x] pass in text args
- [x] pass in form args
- [x] Rerender current url after action
- [ ] verify top level in build
- [ ] verify name in build
- [ ] Test non-actionable functions
- [ ] check to make sure action isnt already exported as something else

- [ ] this looks amazing: https://github.com/lubieowoce/tangle/blob/main/packages/babel-rsc/src/babel-rsc-actions.ts

## Client Components

- [x] Multiple exports
- [ ] SSR should preloadmodule

## Routing

- [x] reload on a new url
- [x] navigate should update the url
- [x] creating new page files should add urls
- [x] cookies / secure cookies
- [x] dynamic params
- [x] query params
- [x] back forward scroll position
- [x] router.refresh
- [x] redirect
- [x] not found
- [x] browser app rsc cache and query params
- [ ] don't allow two dynamic routes with the same dynamic identifier ($id)

## Build

- [ ] Adding a file, deleting a file
- [ ] Server should pause requests while building
- [ ] List of dependencies that should be external
- [ ] allow CC to import css
- [ ] Worker for RSC
- [ ] come up with way of building all apps (public, error, rsc, client)
- [ ] check if middleware export default is a function
- [ ] image imports (rsc, client)

## Static files

- [ ] Redirect to static file
- [ ] Static files should come first in routing checks
- [ ] Rebuild static files when dir changes
- [ ] Prod static files should move into build dir

## Global middleware

- [ ] hasMiddleware shouldn't check for ts file (should look for compiled entry point)

## Create twofold app

- [ ] Ability to install pre-released version of twofold/framework

## Layouts

## HMR

- [ ] find the file that changed, if all capital then trigger refresh otherwise reload window
- [ ] Read this: https://bjornlu.com/blog/hot-module-replacement-is-easy#importmetahotaccept

## DX

- Link should only navigate with local urls
- CSS should reload independent of RSC/CC reload. Possible for CC+CSS to change at same time.
- Verify version of pnpm

## Postgres

- https://github.com/Olshansk/postgres_for_everything?tab=readme-ov-file

## Other

- Preload modules (SSR Store chunks)

## Error pages

- [ ] Don't allow setting cookies during render

## Goals

- https://twitter.com/charca/status/1707901799406207273
- framer motion photo gallery
- https://twitter.com/igarcido/status/1711450565396332800
- Trello
- Draw
- Photo gallery nested layouts

## Design

- https://twitter.com/jh3yy/status/1712881626969997355

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
