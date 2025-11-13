"use client";

import { useFlash } from "@twofold/framework/flash";
import { XMarkIcon } from "@heroicons/react/20/solid";
import * as RadixToast from "@radix-ui/react-toast";
import { AnimatePresence, motion } from "motion/react";
import * as z from "zod";

export function Toaster() {
  let { messagesWithId, removeMessageById } = useFlash({
    schema: z.string(),
  });

  return (
    <RadixToast.Provider>
      <AnimatePresence mode="popLayout" initial={false}>
        {messagesWithId.map(({ content, id }) => (
          <Toast
            key={id}
            text={content}
            onClose={() => removeMessageById(id)}
          />
        ))}
      </AnimatePresence>

      <RadixToast.Viewport className="fixed top-4 right-4 z-20 flex w-80 flex-col-reverse gap-3" />
    </RadixToast.Provider>
  );
}

function Toast({ onClose, text }: { onClose: () => void; text: string }) {
  let width = 320;
  let margin = 16;

  return (
    <RadixToast.Root asChild forceMount onOpenChange={onClose} duration={2500}>
      <motion.li
        layout
        initial={{ x: width + margin }}
        animate={{ x: 0 }}
        exit={{
          opacity: 0,
          zIndex: -1,
          transition: {
            opacity: {
              duration: 0.2,
            },
          },
        }}
        transition={{
          type: "spring",
          mass: 1,
          damping: 30,
          stiffness: 200,
        }}
        style={{ width }}
      >
        <div className="flex items-center justify-between overflow-hidden rounded-lg border border-gray-200 bg-white text-sm whitespace-nowrap text-gray-900 shadow-sm">
          <RadixToast.Description className="truncate p-4">
            {text}
          </RadixToast.Description>
          <RadixToast.Close className="border-l border-gray-100 p-4 text-gray-600 transition hover:bg-gray-50 active:text-black">
            <XMarkIcon className="h-5 w-5" />
          </RadixToast.Close>
        </div>
      </motion.li>
    </RadixToast.Root>
  );
}
