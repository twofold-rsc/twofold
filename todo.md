# TODO

framework

- errors kitchen sink nav
- error in server action module
- entries builder only save map files
- use server file imports and returns client component
- use server file imported and used by client component

- use server file
- only needed at top of file, all functions become actions

- image imports (rsc, browser, ssr)
- redirects
- not found

- prod builds

cli

- bin script should check node version

kitchen sink

- action on page with blocking suspense
- refresh a blocking suspense page
- click link to page that suspends, then router.refresh before it loads
- title/meta head tags

Externals for RSC build (inc react)

Docs

Playwright
Form

## Actions

- [x] Action from RSC
- [x] Actions / mutate state on server
- [x] Action takes form data
- [x] Action takes primitive
- [x] Action passes data into next render
- [ ] Action imported into client component from 'use server' file
- [ ] Action imported into server component from 'use server' file
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

- [ ] Multiple exports
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
- [ ] redirect
- [ ] not found
- [x] browser app rsc cache and query params
- [ ] don't allow two dynamic routes with the same dynamic identifier ($id)

## Build

- [ ] unload css assets (in live reload)
- [ ] How to keep client component builder around
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
- List of external packages

## Other

- Preload modules (SSR Store chunks)

## Error pages

- [ ] Don't allow setting cookies during render

## Outstanding issues

- [ ] CSS doesnt unload when you navigate

## Goals

- https://twitter.com/charca/status/1707901799406207273
- framer motion photo gallery
- https://twitter.com/igarcido/status/1711450565396332800
- Trello
- Draw
- Photo gallery nested layouts

## Design

- https://twitter.com/jh3yy/status/1712881626969997355
