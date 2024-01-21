# TODO

Why you can't set cookies from React Server Components
Precedence blocks rendering until styles load

kitchen sink

create-twofold-app

- copy over base app
- npmrc for node options

Image gallery

Get rid of SSR app
Bundle react in RSC build, import that version for createElement
Better actions
Remove action store
Worker for RSC

Docs

Playwright
Form

## Refactors

- clean up builders
- clean up files

## Actions

- [x] Action from RSC
- [x] Actions / mutate state on server
- [x] Action takes form data
- [x] Action takes primitive
- [x] Action passes data into next render
- [ ] Don't do sep build for actions, do action pass in rsc builder
- [ ] Action imported into client component from 'use server' file

- [x] pass in text args
- [x] pass in form args
- [x] Rerender current url after action
- [ ] verify top level in build
- [ ] verify name in build
- [ ] Test non-actionable functions
- [ ] check to make sure action isnt already exported as something else

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
- [ ] back forward scroll position
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

## Layouts

- [x] Nested layouts
- [ ] Control head/title/meta tags

## HMR

- [ ] Errors
- [ ] find the file that changed, if all capital then trigger refresh otherwise reload window
- [ ] Disable fast refresh code for prod builds

## DX

- Block requests during build
- Clean up post build
- Link should only navigate with local urls
- CSS should reload independent of RSC/CC reload. Possible for CC+CSS to change at same time.
- List of external packages

## Other

- Async local storage (cache)
- Preload modules (SSR Store chunks)

## Error pages

- [x] Have stylesheet load/unload
- [x] server.ts error should return serialized error for RSC requests
- [x] Server action throw
- [x] Server action where client component uses try-catch
- [ ] Errors indexes
- [ ] Test streaming still works

- [ ] RSC with syntax error HMR
- [ ] Client component with syntax error HMR
- [ ] Reloading after recovering for an RSC error
- [ ] Reloading after recovering from a client component error

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
