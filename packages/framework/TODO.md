# Things that don't work correctly in Vite yet

- [x] Encrypted cookies
- [x] Global middleware
- [x] API routes
- [x] Navigation external link (sometimes errors on nav, but nav still succeeds)
- [x] Search params (a render happened where client and server search params do not match)
- [ ] Link fragments (e.g. link#hash)

Link fragments = To solve this we need to go back to `/__rsc/action?path=` encoding

- [x] Pathless API route
- [ ] Route masking after action should not replace side nav
- [ ] Route masking after refresh should not replace side nav
- [ ] Clicking on links in the nav sometimes doesn't update navigation?
- [x] Action calls not found
- [x] Middleware calls redirect
- [x] Typed useActionState redirect - Seems to have same behaviour (doesn't actually redirect)
- [x] Action redirect to another domain
- [x] RSC no default export
- [x] RSC layout no default export
- [x] RSC missing import - Seems to have same behaviour (doesn't actually result in error)
- [x] Server actions throw (does not show error message details)
- [x] SSR throw
- [x] Middleware error (enqueueModel error instead of actual error)
- [x] Async middleware error (enqueueModel error instead of actual error)
- [x] Login UI (unknown error occurred)
- [x] Errors on navigation (such as "RSC no default export") don't push new URL onto browser stack
