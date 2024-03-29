# TODO

framework

- bug: back cache not working when error thrown
  go to server action throws error, trigger, then click back

- error responses should update the url (visit an error page, url doesnt change)

- does rsdw need to be an external?

- prod builds

kitchen sink

- merge redirects branch

- action return types
- strings, objects, thrown errors?

- reload then click a link to the page your on, you get a history entry when you shouldnt
- action on page with blocking suspense
- really fast action with slow page (to test streaming parts in order)
- refresh a blocking suspense page
- click link to page that suspends, then router.refresh before it loads
- title/meta head tags
- restart client builder if entries change
- restart rsc builder if entries change

- Externals for RSC build (inc react)
  https://github.com/LinbuduLab/esbuild-plugins/tree/main/packages/esbuild-plugin-node-externals

Docs

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
- [ ] redirects to static files

## Build

- [ ] unload css assets (in live reload)
- [ ] How to keep rsc and app builder around
- [ ] Time how long each build takes
- [ ] Adding a file, deleting a file
- [ ] Server should pause requests while building
- [ ] Only run one build at a time
- [ ] Live reload updates (client component first, make css independent)
- [ ] List of dependencies that should be external
- [ ] allow CC to import css
- [ ] Worker for RSC
- [ ] come up with way of building all apps (public, error, rsc, client)
- [ ] static routing should come first
- [ ] check if middleware export default is a function
- [ ] image imports (rsc, client)
- [ ] run server, create a new static files, visit it

## Layouts

- [ ] Control head/title/meta tags

## HMR

- [ ] find the file that changed, if all capital then trigger refresh otherwise reload window
- [ ] Disable fast refresh code for prod builds
- [ ] Read this: https://bjornlu.com/blog/hot-module-replacement-is-easy#importmetahotaccept

## DX

- Block requests during build
- Link should only navigate with local urls
- CSS should reload independent of RSC/CC reload. Possible for CC+CSS to change at same time.

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
