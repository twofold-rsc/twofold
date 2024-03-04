"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useRouter } from "@twofold/framework/use-router";
import Link from "@twofold/framework/link";

export default function Nav() {
  let { path } = useRouter();

  return (
    <NavigationMenu.Root className="relative mt-4 flex w-screen justify-center">
      <NavigationMenu.List className="center flex items-center justify-center space-x-12">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Twofold</NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute left-0 top-0">
            <ul className="grid w-[500px] grid-cols-2 gap-1.5 rounded border border-gray-200 p-1.5 shadow-2xl">
              <li>
                <NavigationMenu.Link active={path === "/"} asChild>
                  <Link
                    href="/"
                    className="block h-full rounded-[4px] p-3 hover:bg-gray-50 data-[active]:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">Home</span>
                    <p className="mt-1 text-sm leading-snug text-gray-700">
                      The kitchen sink site, full of demos and examples.
                    </p>
                  </Link>
                </NavigationMenu.Link>
              </li>

              <li>
                <NavigationMenu.Link active={path === "/about"} asChild>
                  <Link
                    href="/about"
                    className="block h-full rounded-[4px] p-3 hover:bg-gray-50 data-[active]:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">About</span>
                    <p className="mt-1 text-sm leading-snug text-gray-700">
                      Information about this app.
                    </p>
                  </Link>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Examples</NavigationMenu.Trigger>
          <NavigationMenu.Content className="absolute left-0 top-0">
            <NavigationMenu.Sub
              defaultValue="react"
              orientation="vertical"
              className="w-[650px]"
            >
              <div className="flex overflow-hidden rounded border-4 border-gray-100 bg-gray-100 shadow-2xl">
                <div className="w-1/4">
                  <NavigationMenu.List className="space-y-1 bg-gray-100 pr-1">
                    <NavigationMenu.Item value="react">
                      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
                        React
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        <ul className="grid grid-cols-2 gap-2">
                          <li>
                            <NavigationMenu.Link
                              active={path === "/react/use-id"}
                              asChild
                            >
                              <Link href="/react/use-id" className="block">
                                <span className="font-medium text-gray-900">
                                  useId
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  The useId hook from React
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/react/use-form-state"}
                              asChild
                            >
                              <Link
                                href="/react/use-form-state"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  useFormState
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A hook for managing form state.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/react/use-optimistic"}
                              asChild
                            >
                              <Link
                                href="/react/use-optimistic"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  useOptimistic
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A hook that shows optimistic updates.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/react/suspense"}
                              asChild
                            >
                              <Link href="/react/suspense" className="block">
                                <span className="font-medium text-gray-900">
                                  Suspense
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Suspense boundaries.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/react/cache"}
                              asChild
                            >
                              <Link href="/react/cache" className="block">
                                <span className="font-medium text-gray-900">
                                  cache
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Dedupe data requests with React's cache
                                  helper.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item value="actions">
                      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
                        Server actions
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        <ul className="grid grid-cols-2 gap-2">
                          <li>
                            <NavigationMenu.Link
                              active={path === "/server-actions"}
                              asChild
                            >
                              <Link href="/server-actions" className="block">
                                <span className="font-medium text-gray-900">
                                  Server action
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A function that runs on the server.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/server-actions/client-action"}
                              asChild
                            >
                              <Link
                                href="/server-actions/client-action"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Client action
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A client component that invokes a server
                                  action.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/server-actions/form-data"}
                              asChild
                            >
                              <Link
                                href="/server-actions/form-data"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Form data
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A server action that works with forms and form
                                  data.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/server-actions/bind"}
                              asChild
                            >
                              <Link
                                href="/server-actions/bind"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Bound action
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A server action that binds to a component
                                  prop.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item value="client-components">
                      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
                        Client components
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        <ul className="grid grid-cols-2 gap-2">
                          <li>
                            <NavigationMenu.Link
                              active={path === "/client-components"}
                              asChild
                            >
                              <Link href="/client-components" className="block">
                                <span className="font-medium text-gray-900">
                                  Client component
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A component that runs on the client.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={
                                path === "/client-components/named-exports"
                              }
                              asChild
                            >
                              <Link
                                href="/client-components/named-exports"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Named exports
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A file that exports multiple client
                                  components.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item value="cookies">
                      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
                        HTTP server
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        <ul className="grid grid-cols-2 gap-2">
                          <li>
                            <NavigationMenu.Link
                              active={path === "/http/cookies"}
                              asChild
                            >
                              <Link href="/http/cookies" className="block">
                                <span className="font-medium text-gray-900">
                                  Cookies
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Read, set, and destroy cookies.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/http/middleware"}
                              asChild
                            >
                              <Link href="/http/middleware" className="block">
                                <span className="font-medium text-gray-900">
                                  Middleware
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Run code before rendering a page.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={
                                path === "/http/middleware?global-middleware=1"
                              }
                              asChild
                            >
                              <Link
                                href="/http/middleware?global-middleware=1"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Global middleware
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Run code before handling a request.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/http/streaming"}
                              asChild
                            >
                              <Link href="/http/streaming" className="block">
                                <span className="font-medium text-gray-900">
                                  Streaming
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Stream suspense boundaries as they resolve.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/http/public"}
                              asChild
                            >
                              <Link href="/http/public" className="block">
                                <span className="font-medium text-gray-900">
                                  Public folder
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Public folder for static assets
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item value="build">
                      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
                        Build
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        <ul className="grid grid-cols-2 gap-2">
                          <li>
                            <NavigationMenu.Link
                              active={path === "/build/css"}
                              asChild
                            >
                              <Link href="/build/css" className="block">
                                <span className="font-medium text-gray-900">
                                  CSS
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  A page with custom css.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/build/dev-reload"}
                              asChild
                            >
                              <Link href="/build/dev-reload" className="block">
                                <span className="font-medium text-gray-900">
                                  Dev reload
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Reload pages in development as they are
                                  edited.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/build/hmr"}
                              asChild
                            >
                              <Link href="/build/hmr" className="block">
                                <span className="font-medium text-gray-900">
                                  HMR
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Hot module reloading of client components.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item value="routing">
                      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
                        Routing
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content>
                        <ul className="grid grid-cols-2 gap-2">
                          <li>
                            <NavigationMenu.Link
                              active={path === "/routing/use-router"}
                              asChild
                            >
                              <Link
                                href="/routing/use-router"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  useRouter
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  The hook that controls the router.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/routing/search-params"}
                              asChild
                            >
                              <Link
                                href="/routing/search-params"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Search params
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Read query search params from the URL.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/routing/nested-layouts"}
                              asChild
                            >
                              <Link
                                href="/routing/nested-layouts"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Nested layouts
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Use layouts to nest shared UI between pages.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/routing/slugs"}
                              asChild
                            >
                              <Link href="/routing/slugs" className="block">
                                <span className="font-medium text-gray-900">
                                  Dynamic URLs
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Use dynamic params to load different data
                                  based off the URL.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/routing/scroll-position"}
                              asChild
                            >
                              <Link
                                href="/routing/scroll-position"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Scroll position
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Maintain scroll position as you navigate
                                  around the app.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                          <li>
                            <NavigationMenu.Link
                              active={path === "/routing/path-normalization/"}
                              asChild
                            >
                              <Link
                                href="/routing/path-normalization/"
                                className="block"
                              >
                                <span className="font-medium text-gray-900">
                                  Path normalization
                                </span>
                                <p className="mt-1 text-sm leading-snug text-gray-700">
                                  Remove trailing slashes from URLs.
                                </p>
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>

                    <NavigationMenu.Indicator className="z-1 -right-5 flex h-6 items-center justify-center overflow-hidden">
                      <div className="relative -left-[70%] flex h-6 w-6 rotate-45 items-center justify-center rounded-[3px] bg-gray-100">
                        <div className="relative h-4 w-4 rounded-[1.5px] bg-white" />
                      </div>
                    </NavigationMenu.Indicator>
                  </NavigationMenu.List>
                </div>

                <div className="w-3/4 rounded bg-white px-4 py-3">
                  <NavigationMenu.Viewport />
                </div>
              </div>
            </NavigationMenu.Sub>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Indicator className="z-1 top-full flex h-2.5 items-end justify-center overflow-hidden">
          <div className="relative top-[70%] h-2.5 w-2.5 rotate-45 rounded-tl-[2px] bg-gray-300" />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>

      <div className="absolute left-0 top-full flex w-full justify-center">
        <NavigationMenu.Viewport className="relative mt-2.5 h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] bg-white" />
      </div>
    </NavigationMenu.Root>
  );
}
