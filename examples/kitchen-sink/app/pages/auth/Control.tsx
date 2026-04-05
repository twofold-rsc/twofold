"use client";

import React, { ReactNode, useState, useTransition } from "react";
import { clearCookie, setCookie } from "./cookie";
import protectedAction from "./protected/action/protectedAction";
import unprotectedAction from "./protected/unprotected/action/unprotectedAction";
import { isServerActionUnauthorizedError } from "@twofold/framework/auth";

function TestLink(props: { href: string }) {
  return (
    <a
      href={props.href}
      target="page-test"
      className="mx-auto mt-2 mb-2 inline-block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
    >
      Test
    </a>
  );
}

function Td(props: { children: React.ReactNode }) {
  return <td className="text-center">{props.children}</td>;
}

function TestServerAction(props: {
  behaviour: string;
  startTransition: any;
  setComponent: any;
  unprotected?: boolean;
}) {
  const submitAction = async (formData: FormData) => {
    props.startTransition(async () => {
      try {
        let c = await (props.unprotected ? unprotectedAction : protectedAction)(
          formData,
        );
        props.setComponent(c);
      } catch (err) {
        if (isServerActionUnauthorizedError(err)) {
          props.setComponent(<div>Request was unauthorized.</div>);
        } else {
          props.setComponent(<div>An error occurred: {err?.toString()}</div>);
        }
      }
    });
  };
  return (
    <form action={submitAction}>
      <input name="behaviour" value={props.behaviour} type="hidden" />
      <button
        type="submit"
        className="mx-auto mt-2 mb-2 inline-block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
      >
        Test
      </button>
    </form>
  );
}

export default function Control(props: { allowIfCookieSetWillPass: boolean }) {
  let [component, setComponent] = useState<ReactNode>();
  let [isPending, startTransition] = useTransition();

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Auth examples</h1>
      <p className="mt-3">
        General access to routes protected by <code>allowIfCookieSet</code>:{" "}
        {!props.allowIfCookieSetWillPass ? (
          <span className="text-red-500">Denied</span>
        ) : (
          <span className="text-green-500">Allowed</span>
        )}
      </p>
      <form action={setCookie} className="mt-3">
        <button
          type="submit"
          className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Set cookie for general access
        </button>
      </form>
      <form action={clearCookie} className="mt-3">
        <button
          type="submit"
          className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Remove cookie for general access
        </button>
      </form>

      <h1 className="mt-10 text-3xl font-black tracking-tighter">
        Examples table
      </h1>
      <table className="mt-3 w-full">
        <tr>
          <th></th>
          <th>None</th>
          <th>
            <code>response</code>
          </th>
          <th>
            <code>response-throw</code>
          </th>
          <th>
            <code>deny</code>
          </th>
          <th>
            <code>deny-throw</code>
          </th>
          <th>
            <code>error</code>
          </th>
          <th>
            <code>redirect</code>
          </th>
          <th>
            <code>allow</code>
          </th>
        </tr>
        <tr>
          <th>Page</th>
          <Td>
            <TestLink href="/auth/protected/page" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=response" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=response-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=deny" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=deny-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=error" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=redirect" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/page?auth-behaviour=allow" />
          </Td>
        </tr>
        <tr>
          <th>Server action</th>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour=""
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="response"
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="response-throw"
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="deny"
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="deny-throw"
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="error"
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="redirect"
            />
          </Td>
          <Td>
            <TestServerAction
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="allow"
            />
          </Td>
        </tr>
        <tr>
          <th>API route</th>
          <Td>
            <TestLink href="/auth/protected/api" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=response" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=response-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=deny" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=deny-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=error" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=redirect" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/api?auth-behaviour=allow" />
          </Td>
        </tr>
        <tr style={{ borderTop: "solid 1px #000" }}>
          <th>Unprotected page</th>
          <Td>
            <TestLink href="/auth/protected/unprotected/page" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=response" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=response-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=deny" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=deny-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=error" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=redirect" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/page?auth-behaviour=allow" />
          </Td>
        </tr>
        <tr>
          <th>Unprotected server action</th>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour=""
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="response"
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="response-throw"
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="deny"
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="deny-throw"
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="error"
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="redirect"
            />
          </Td>
          <Td>
            <TestServerAction
              unprotected
              startTransition={startTransition}
              setComponent={setComponent}
              behaviour="allow"
            />
          </Td>
        </tr>
        <tr>
          <th>Unprotected API route</th>
          <Td>
            <TestLink href="/auth/protected/unprotected/api" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=response" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=response-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=deny" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=deny-throw" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=error" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=redirect" />
          </Td>
          <Td>
            <TestLink href="/auth/protected/unprotected/api?auth-behaviour=allow" />
          </Td>
        </tr>
      </table>

      {isPending || component ? (
        <>
          <h1 className="mt-10 text-3xl font-black tracking-tighter">
            Server action returned component
          </h1>
          <div className="mt-3 w-full rounded-sm border border-black">
            {isPending ? "Component is loading..." : component}
          </div>
        </>
      ) : null}

      <h1 className="mt-10 text-3xl font-black tracking-tighter">
        Page &amp; API route test iframe
      </h1>
      <iframe
        name="page-test"
        className="mt-3 w-full rounded-sm border border-black"
        height={300}
      ></iframe>
    </div>
  );
}
