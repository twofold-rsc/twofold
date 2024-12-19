"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useRouter } from "@twofold/framework/use-router";
import Link from "@twofold/framework/link";
import { ReactNode, useState } from "react";

export default function Nav() {
  let { path } = useRouter();
  let currentSectionPath = path.split("/").slice(0, 2).join("/");
  let initial = currentSectionPath === "/" ? "/react" : currentSectionPath;

  let [selectedSectionPath, setSelectedSectionPath] = useState(initial);

  return (
    <NavigationMenu.Root className="relative z-10 mt-4 flex w-screen justify-center">
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
                      The kitchen sink site, full of examples and tests.
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
              value={selectedSectionPath}
              onValueChange={(value) => setSelectedSectionPath(value)}
              orientation="vertical"
              className="w-[650px]"
            >
              <div className="flex overflow-hidden rounded border-4 border-gray-100 bg-gray-100 shadow-2xl">
                <div className="w-1/4">
                  <NavigationMenu.List className="space-y-1 bg-gray-100 pr-1">
                    <ExampleGroup name="React" path="/react">
                      <ExampleLink
                        title="useId"
                        description="The useId hook from React"
                        href="/react/use-id"
                      />
                      <ExampleLink
                        title="useActionState"
                        description="A hook for managing form state."
                        href="/react/use-action-state"
                      />
                      <ExampleLink
                        title="useOptimistic"
                        description="A hook that shows optimistic updates."
                        href="/react/use-optimistic"
                      />
                      <ExampleLink
                        title="Suspense"
                        description="Suspense boundaries."
                        href="/react/suspense"
                      />
                      <ExampleLink
                        title="cache"
                        description="Dedupe data requests with React's cache helper."
                        href="/react/cache"
                      />
                      <ExampleLink
                        title="Logging"
                        description="RSC server to client logging."
                        href="/react/logging"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="Server actions" path="/server-actions">
                      <ExampleLink
                        title="Server action"
                        description="A function that runs on the server."
                        href="/server-actions"
                      />
                      <ExampleLink
                        title="Client action"
                        description="A client component that invokes a server function."
                        href="/server-actions/client"
                      />
                      <ExampleLink
                        title="Form data"
                        description="A server action that works with forms and form data."
                        href="/server-actions/form-data"
                      />
                      <ExampleLink
                        title="Bound form data"
                        description="A server action that works with forms and closures."
                        href="/server-actions/form-data-bound"
                      />
                      <ExampleLink
                        title="Bound object"
                        description="A server action that works with forms and objects."
                        href="/server-actions/bound-object"
                      />
                      <ExampleLink
                        title="Manual binding"
                        description="A server action that manually binds to a component prop."
                        href="/server-actions/manual-bind"
                      />
                      <ExampleLink
                        title="Automatic binding"
                        description="A server action that automatically binds to a component prop."
                        href="/server-actions/automatic-bind"
                      />
                      <ExampleLink
                        title="Actions file RSC"
                        description="A server action imported into an RSC."
                        href="/server-actions/actions-file-for-rsc"
                      />
                      <ExampleLink
                        title="Actions file CC"
                        description="A server action imported into a client component."
                        href="/server-actions/actions-file-for-cc"
                      />
                      <ExampleLink
                        title="Action returns CC"
                        description="A server action that returns a client component."
                        href="/server-actions/action-returns-cc"
                      />
                      <ExampleLink
                        title="Action factory"
                        description="An action that is created by a factory."
                        href="/server-actions/function-factory"
                      />
                      <ExampleLink
                        title="Slow action"
                        description="An action that is very slow."
                        href="/server-actions/slow-function"
                      />
                    </ExampleGroup>

                    <ExampleGroup
                      name="Client components"
                      path="/client-components"
                    >
                      <ExampleLink
                        title="Client component"
                        description="A component that runs on the client."
                        href="/client-components"
                      />
                      <ExampleLink
                        title="Named exports"
                        description="A file that exports multiple client components."
                        href="/client-components/named-exports"
                      />
                      <ExampleLink
                        title="Unformatted files"
                        description="A file that exports an unformatted client component."
                        href="/client-components/unformatted"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="HTTP" path="/http">
                      <ExampleLink
                        title="Cookies"
                        description="Read, set, and destroy cookies."
                        href="/http/cookies"
                      />
                      <ExampleLink
                        title="Middleware"
                        description="Run code before rendering a page."
                        href="/http/middleware"
                      />
                      <ExampleLink
                        title="Streaming"
                        description="Stream suspense boundaries as they resolve."
                        href="/http/streaming"
                      />
                      <ExampleLink
                        title="Public folder"
                        description="Public folder for static assets"
                        href="/http/public"
                      />
                      <ExampleLink
                        title="API routes"
                        description="API for lower-level access to the server."
                        href="/http/api"
                      />
                      <ExampleLink
                        title="Request forwarding"
                        description="Request normalization for proxies and load balancers."
                        href="/http/request-forwarding"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="Build" path="/build">
                      <ExampleLink
                        title="CSS"
                        description="A page with custom css."
                        href="/build/css"
                      />
                      <ExampleLink
                        title="Dev reload"
                        description="Reload pages in development as they are edited."
                        href="/build/dev-reload"
                      />
                      <ExampleLink
                        title="HMR"
                        description="Hot module reloading of client components."
                        href="/build/hmr"
                      />
                      <ExampleLink
                        title="Externals"
                        description="External packages that should not be bundled."
                        href="/build/config/external-packages"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="Runtime" path="/runtime">
                      <ExampleLink
                        title="ENVs"
                        description="Environment variables loaded from .env files."
                        href="/runtime/env"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="Routing" path="/routing">
                      <ExampleLink
                        title="useRouter"
                        description="The hook that controls the router."
                        href="/routing/use-router"
                      />
                      <ExampleLink
                        title="useOptimisticRoute"
                        description="The hook that sees the router's future."
                        href="/routing/use-optimistic-route"
                      />
                      <ExampleLink
                        title="Navigation"
                        description="Navigation between different pages"
                        href="/routing/navigation"
                      />
                      <ExampleLink
                        title="Search params"
                        description="Read query search params from the URL."
                        href="/routing/search-params"
                      />
                      <ExampleLink
                        title="Link fragments"
                        description="Use fragments to link to different content on the page."
                        href="/routing/fragments"
                      />
                      <ExampleLink
                        title="Nested layouts"
                        description="Use layouts to nest shared UI between pages."
                        href="/routing/nested-layouts"
                      />
                      <ExampleLink
                        title="Dynamic URLs"
                        description="Use dynamic params to load different data based off the URL."
                        href="/routing/slugs"
                      />
                      <ExampleLink
                        title="Scroll position"
                        description="Maintain scroll position as you navigate around the app."
                        href="/routing/scroll-position"
                      />
                      <ExampleLink
                        title="Path normalization"
                        description="Remove trailing slashes from URLs."
                        href="/routing/path-normalization/"
                      />
                      <ExampleLink
                        title="Not found"
                        description="Handle missing pages and 404 errors."
                        href="/routing/not-found"
                      />
                      <ExampleLink
                        title="Redirects"
                        description="Handle redirects from pages and actions."
                        href="/routing/redirects"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="Errors" path="/error-handling">
                      <ExampleLink
                        title="Client component errors"
                        description="Errors that happen in client components."
                        href="/error-handling/client-components"
                      />
                      <ExampleLink
                        title="RSC errors"
                        description="Errors that happen in RSCs."
                        href="/error-handling/rsc"
                      />
                      <ExampleLink
                        title="Server action errors"
                        description="Errors that happen in server actions."
                        href="/error-handling/server-actions"
                      />
                      <ExampleLink
                        title="SSR errors"
                        description="Errors that happen during the SSR pass."
                        href="/error-handling/ssr"
                      />
                      <ExampleLink
                        title="Boundary"
                        description="Add a custom error boundary to your app."
                        href="/error-handling/boundary"
                      />
                    </ExampleGroup>

                    <ExampleGroup name="UIs" path="/uis">
                      <ExampleLink
                        title="Login"
                        description="A login form using client components, server actions, cookies, and redirects."
                        href="/uis/login"
                      />
                    </ExampleGroup>

                    <NavigationMenu.Indicator className="-right-5 z-10 flex h-6 items-center justify-center overflow-hidden">
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

        <NavigationMenu.Indicator className="top-full z-10 flex h-2.5 items-end justify-center overflow-hidden">
          <div className="relative top-[70%] h-2.5 w-2.5 rotate-45 rounded-tl-[2px] bg-gray-300" />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>

      <div className="absolute left-0 top-full flex w-full justify-center">
        <NavigationMenu.Viewport className="relative mt-2.5 h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] bg-white" />
      </div>
    </NavigationMenu.Root>
  );
}

function ExampleGroup({
  name,
  path,
  children,
}: {
  name: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <NavigationMenu.Item value={path}>
      <NavigationMenu.Trigger className="w-full rounded-[3px] px-1.5 py-0.5 text-left font-medium text-gray-900 data-[state=open]:bg-white">
        {name}
      </NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-5 pb-2 pl-2 pr-1">
          {children}
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}

function ExampleLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  let { path } = useRouter();

  return (
    <li>
      <NavigationMenu.Link active={path === href} asChild>
        <Link href={href} className="block">
          <h6 className="font-medium text-gray-900">{title}</h6>
          <p className="text-sm leading-snug text-gray-500">{description}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  );
}
