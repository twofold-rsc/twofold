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
- [ ] RSC no default export
- [ ] RSC layout no default export
- [ ] RSC missing import
- [ ] Server actions throw (does not show error message details)
- [ ] SSR throw
- [ ] Middleware error (enqueueModel error instead of actual error)
- [ ] Async middleware error (enqueueModel error instead of actual error)
- [ ] Login UI (unknown error occurred)
- [ ] Errors on navigation (such as "RSC no default export") don't push new URL onto browser stack
