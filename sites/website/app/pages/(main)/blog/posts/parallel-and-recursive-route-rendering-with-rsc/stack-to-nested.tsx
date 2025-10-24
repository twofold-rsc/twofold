"use client";

import { useState } from "react";
import { motion, LayoutGroup, HTMLMotionProps } from "motion/react";
import clsx from "clsx";
import { PlayIcon } from "@heroicons/react/20/solid";

export function StackToNested() {
  const [step, setStep] = useState(0);

  function start() {
    setStep(1);
  }

  function restart() {
    setStep(0);
    setTimeout(() => {
      setStep(1);
    }, 1000);
  }

  return (
    <div className="not-prose -mx-2 my-5 sm:mx-0 sm:my-8">
      <div className="mb-4 flex items-center justify-center gap-x-3">
        <button
          onClick={step === 0 ? start : restart}
          className="inline-flex items-center justify-center rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          disabled={step !== 0 && step !== 6}
        >
          <PlayIcon className="mr-1 size-3" />
          Play
        </button>
      </div>

      <div className="flex items-center text-sm">
        <div className="flex w-1/2 items-center justify-center">
          Server stack
        </div>
        <div className="flex w-1/2 items-center justify-center">
          Client render
        </div>
      </div>

      <LayoutGroup id="stack-nested-demo">
        <div className="mt-4 flex w-full">
          <div className="relative w-1/2 border-r-2 border-dashed border-gray-200 pr-4">
            {step < 1 ? (
              <Card
                id="A"
                className="border-amber-500 bg-amber-50 text-amber-600"
              >
                <Tag layout text="<RootLayout>" />
                <Tag layout text="<Placeholder />" indent={1} />
                <Tag layout text="</RootLayout>" />
              </Card>
            ) : (
              <Spacer size={3} />
            )}

            {step < 3 ? (
              <Card
                id="B"
                className="my-4 border-violet-500 bg-violet-50 text-violet-600"
              >
                <Tag layout text="<PostsLayout>" />
                <Tag layout text="<Placeholder />" indent={1} />
                <Tag layout text="</PostsLayout>" />
              </Card>
            ) : (
              <Spacer size={3} className="my-4" />
            )}

            {step < 5 ? (
              <Card
                id="C"
                className="mt-4 border-blue-500 bg-blue-50 text-blue-600"
              >
                <Tag layout text="<EditPage postId={postId} />" />
              </Card>
            ) : (
              <Spacer size={1} className="mt-4" />
            )}

            {step === 6 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 italic"
              >
                Empty
              </motion.div>
            )}
          </div>

          <div className="w-1/2 pl-4">
            <div className="relative flex h-full w-full items-center justify-center">
              {step >= 1 ? (
                <Card
                  id="A"
                  className="relative z-10 border-amber-500 bg-amber-50 text-amber-600"
                  onLayoutAnimationComplete={() => {
                    if (step === 1) {
                      setTimeout(() => {
                        setStep(2);
                      }, 300);
                    }
                  }}
                >
                  <Tag layout text="<RootLayout>" />
                  {step >= 3 ? (
                    <Card
                      id="B"
                      className="relative z-20 my-3 w-full border-violet-500 bg-violet-50 text-violet-600 sm:my-4"
                      onLayoutAnimationComplete={() => {
                        if (step === 3) {
                          setTimeout(() => {
                            setStep(4);
                          }, 300);
                        }
                      }}
                    >
                      <Tag layout text="<PostsLayout>" />
                      {step >= 5 ? (
                        <Card
                          id="C"
                          className="relative z-30 my-3 border-blue-500 bg-blue-50 text-blue-600 sm:my-4"
                          onLayoutAnimationComplete={() => {
                            if (step === 5) {
                              setTimeout(() => {
                                setStep(6);
                              }, 300);
                            }
                          }}
                        >
                          <Tag text="<EditPage postId={postId} />" />
                        </Card>
                      ) : (
                        <Tag
                          text="<Placeholder />"
                          indent={1}
                          style={{
                            color:
                              "color-mix(in oklch, var(--color-violet-600), var(--color-violet-200) calc(var(--flash-t, 0) * 1%))",
                          }}
                          variants={{
                            on: {
                              "--flash-t": [0, 100, 0],
                            },
                            off: { "--flash-t": 0 },
                          }}
                          transition={{
                            repeat: 2,
                            repeatType: "loop",
                            duration: 0.4,
                            ease: "linear",
                          }}
                          {...(step === 4 ? { animate: "on" } : {})}
                          onAnimationComplete={() => {
                            if (step === 4) {
                              setTimeout(() => {
                                setStep(5);
                              }, 500);
                            }
                          }}
                        />
                      )}

                      <Tag layout text="</PostsLayout>" />
                    </Card>
                  ) : (
                    <Tag
                      text="<Placeholder />"
                      indent={1}
                      style={{
                        color:
                          "color-mix(in oklch, var(--color-amber-600), var(--color-amber-200) calc(var(--flash-t, 0) * 1%))",
                      }}
                      variants={{
                        on: {
                          "--flash-t": [0, 100, 0],
                        },
                        off: { "--flash-t": 0 },
                      }}
                      transition={{
                        repeat: 2,
                        repeatType: "loop",
                        duration: 0.4,
                        ease: "linear",
                      }}
                      {...(step === 2 ? { animate: "on" } : {})}
                      onAnimationComplete={() => {
                        if (step === 2) {
                          setTimeout(() => {
                            setStep(3);
                          }, 500);
                        }
                      }}
                    />
                  )}
                  <Tag layout text="</RootLayout>" />
                </Card>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Nothing rendered
                </div>
              )}
            </div>
          </div>
        </div>
      </LayoutGroup>
    </div>
  );
}

function Tag({
  text,
  className = "",
  indent = 0,
  ...rest
}: {
  text: string;
  className?: string | undefined;
  indent?: number | undefined;
} & HTMLMotionProps<"pre">) {
  let output = `${" ".repeat(indent * 2)}${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;

  return (
    <motion.pre
      {...rest}
      dangerouslySetInnerHTML={{ __html: output }}
      className={clsx("overflow-x-hidden font-mono font-semibold", className)}
    />
  );
}

function Spacer({
  size,
  className = "",
}: {
  size: number;
  className?: string;
}) {
  return (
    <pre
      className={clsx(
        "border-2 border-transparent p-3 text-xs font-semibold sm:p-4 sm:text-sm",
        className,
      )}
    >
      {Array(size).fill("\n").join("")}
    </pre>
  );
}

function Card({
  id,
  className = "",
  children,
  ...rest
}: {
  id: string;
  className?: string;
  children?: React.ReactNode;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      layoutId={`card-${id}`}
      layout
      // transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className={clsx(
        "w-full rounded-md border-2 p-3 text-xs font-semibold sm:p-4 sm:text-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
