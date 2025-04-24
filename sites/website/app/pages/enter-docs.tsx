"use client";

import Link from "@twofold/framework/link";
import { useAnimate } from "framer-motion";
import { useRouter } from "@twofold/framework/use-router";
import {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  createContext,
  startTransition,
  use,
  useContext,
  useEffect,
  useState,
} from "react";

let Context = createContext({
  state: "visible",
  animateHomepageExit: () => Promise.resolve("homepage-exited"),
  animateDocsEntrance: () => Promise.resolve("docs-entered"),
});

export function EnterDocs({
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  let [scope, animate] = useAnimate();
  let [animation, setAnimation] = useState<Promise<string>>();

  // initial, homepage-exited, docs-entered
  let state = animation ? use(animation) : "initial";

  function animateHomepageExit() {
    let controls = animate([
      [
        "[data-enter-docs-section='hero']",
        { opacity: 0 },
        {
          duration: 0.75,
        },
      ],
      [
        "[data-enter-docs-section='grid']",
        {
          scale: 26,
          // transform: "scale(26)",
          backgroundColor: "rgb(229,231,235)",
        },
        {
          duration: 0.8,
          ease: [0.5, 0, 0.75, 0],
          at: "<",
        },
      ],
    ]);

    let promise = new Promise<string>((resolve) => {
      controls.then(() => resolve("homepage-exited"));
    });

    setAnimation(promise);

    return promise;
  }

  function animateDocsEntrance() {
    let controls = animate([
      [
        "[data-enter-docs-section='enter-docs']",
        {
          opacity: 1,
          transform: "scale(1)",
        },
        {
          duration: 0.25,
          ease: [0.25, 1, 0.5, 1],
        },
      ],
    ]);

    let promise = new Promise<string>((resolve) => {
      controls.then(() => resolve("docs-entered"));
    });

    setAnimation(promise);

    return promise;
  }

  return (
    <Context.Provider
      value={{
        state,
        animateHomepageExit,
        animateDocsEntrance,
      }}
    >
      <div ref={scope} {...rest}>
        {children}
      </div>
    </Context.Provider>
  );
}

export function EnterDocsLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
}) {
  let { animateHomepageExit } = useContext(Context);
  let { navigate } = useRouter();

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // modified click test
    let isModifiedEvent = e.metaKey || e.altKey || e.ctrlKey || e.shiftKey;

    if (!isModifiedEvent) {
      e.preventDefault();

      startTransition(() => {
        animateHomepageExit();
        navigate(href);
      });
    }
  }

  return (
    <Link onClick={handleClick} {...rest} href={href}>
      {children}
    </Link>
  );
}

export function EnterDocsAnimation({
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  let { animateDocsEntrance, state } = useContext(Context);

  useEffect(() => {
    if (state === "homepage-exited") {
      animateDocsEntrance();
    }
  }, [animateDocsEntrance, state]);

  return (
    <div
      data-enter-docs-section="enter-docs"
      style={{
        opacity: state === "homepage-exited" ? 0 : 1,
        transform: `scale(${state === "homepage-exited" ? 0.95 : 1})`,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
