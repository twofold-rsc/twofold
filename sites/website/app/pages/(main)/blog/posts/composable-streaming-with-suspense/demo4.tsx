"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Model, models } from "./models";
import { Arrow } from "../../components/arrows";
import invariant from "tiny-invariant";

export function Demo4() {
  return (
    <div className="not-prose group -mx-2 my-8 md:-mx-8">
      <div className="rounded-lg bg-slate-50 p-3 shadow-md ring-1 ring-slate-950/5">
        <div>
          <textarea
            placeholder="Chat with your favorite AI model..."
            rows={2}
            className="block w-full resize-none text-base text-slate-900 focus:outline-none sm:text-base"
          />
        </div>
        <div className="flex items-end justify-between">
          <ModelSelect models={models} />
          <button className="inline-flex size-6 items-center justify-center rounded-full bg-blue-500">
            <ArrowRightIcon className="size-3.5 stroke-[2.5] text-white" />
          </button>
        </div>
      </div>

      <div className="relative pb-8">
        <div className="absolute -top-[30px] left-[24px] group-has-[[data-open]]:hidden sm:-top-[36px] sm:left-[110px]">
          <div className="relative">
            <Arrow className="w-22 -rotate-[15deg] text-red-500" />
            <span className="font-handwriting absolute bottom-[19px] left-[100px] text-xl font-semibold whitespace-nowrap text-red-500">
              Try selecting a model
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelSelect({ models }: { models: Model[] }) {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  invariant(selectedModel);

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
        className="-mx-1.5 w-[320px] rounded-md bg-white px-5 py-1.5 shadow-lg ring-1 ring-slate-950/5 select-none data-[open]:outline-none"
      >
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
      </ListboxOptions>
    </Listbox>
  );
}
