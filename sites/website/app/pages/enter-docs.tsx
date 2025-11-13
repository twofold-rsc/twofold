"use client";

import Link from "@twofold/framework/link";
import { useAnimate } from "motion/react";
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

type State = "initial" | "homepage-exited" | "docs-entered";

let Context = createContext<{
  state: State;
  animateHomepageExit?: () => ReturnType<ReturnType<typeof useAnimate>[1]>;
  animateDocsEntrance?: () => ReturnType<ReturnType<typeof useAnimate>[1]>;
}>({
  state: "initial",
});

export function EnterDocs({
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  let [scope, animate] = useAnimate();
  let [animation, setAnimation] =
    useState<Promise<"homepage-exited" | "docs-entered">>();

  // initial, homepage-exited, docs-entered
  let state: State = animation ? use(animation) : "initial";

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

    let promise = new Promise<"homepage-exited">((resolve) => {
      controls.then(() => {
        resolve("homepage-exited");
      });
    });

    setAnimation(promise);

    return controls;
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

    let promise = new Promise<"docs-entered">((resolve) => {
      controls
        .then(() => {
          resolve("docs-entered");
        })
        .catch((e) => {
          //
        });
    });

    setAnimation(promise);

    return controls;
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
        if (animateHomepageExit) {
          animateHomepageExit();
        }
        navigate(href);
      });
    }
  }

  return (
    <Link
      onClick={handleClick}
      {...rest}
      href={href}
      ref={(el) => {
        if (el && el.getAttribute("data-focus")) {
          el.focus();
          el.removeAttribute("data-focus");
        }
        return () => {};
      }}
    >
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
    if (state === "homepage-exited" && animateDocsEntrance) {
      let controls = animateDocsEntrance();
      return () => controls.stop();
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
