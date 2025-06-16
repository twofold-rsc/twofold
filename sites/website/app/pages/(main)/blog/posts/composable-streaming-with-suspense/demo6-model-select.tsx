"use client";

import { ReactNode, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Model, models } from "./models";

export function Demo6ModelSelect({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  return (
    <Listbox value={selectedModel} onChange={setSelectedModel}>
      <ListboxButton className="group z-10 -mx-1.5 -my-1.5 inline-flex items-center justify-center rounded px-1.5 py-1.5 text-sm font-medium hover:bg-slate-950/5 focus:outline-none">
        <selectedModel.icon className="mr-1.5 size-4 text-black" />
        <span className="mr-1">{selectedModel.name}</span>
        <ChevronDownIcon className="size-5 text-slate-500 group-data-[hover]:text-slate-600" />
      </ListboxButton>
      <ListboxOptions
        anchor={{
          to: "bottom start",
          gap: "12px",
        }}
        unmount={false}
        className="-mx-1.5 w-[300px] rounded-md bg-white px-5 py-1.5 shadow-lg ring-1 ring-slate-950/5 select-none data-[open]:outline-none sm:w-[320px]"
      >
        {children}
      </ListboxOptions>
    </Listbox>
  );
}

export function Demo6ModelSelectOptions({ models }: { models: Model[] }) {
  return (
    <>
      {models.map((model) => (
        <ListboxOption
          key={model.id}
          disabled={model.paid}
          value={model}
          className={clsx(
            "-mx-3.5 rounded px-3.5 py-3.5 data-[selected]:outline-none",
            model.paid && "cursor-not-allowed",
            !model.paid && "hover:bg-slate-50",
          )}
        >
          <div className="flex space-x-2.5">
            <model.icon
              className={clsx(
                "size-4.5 shrink-0 text-black",
                model.paid && "opacity-50",
              )}
            />

            <div className="grow">
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "text-[15px] leading-none font-medium text-slate-800",
                    model.paid && "opacity-50",
                  )}
                >
                  {model.name}
                </span>
                {model.paid && (
                  <span className="ml-auto rounded bg-red-50 px-1 py-0.5 text-xs font-semibold whitespace-nowrap text-red-500">
                    Buy access
                  </span>
                )}
              </div>
              <p
                className={clsx(
                  "mt-1.5 text-xs text-slate-600",
                  model.paid && "opacity-50",
                )}
              >
                {model.description}
              </p>
            </div>
          </div>
        </ListboxOption>
      ))}
    </>
  );
}
