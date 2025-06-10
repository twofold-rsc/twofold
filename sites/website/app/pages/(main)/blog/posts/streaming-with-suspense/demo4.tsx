"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ComponentProps, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export function Demo4() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap"
        rel="stylesheet"
      />
      <div className="not-prose group -mx-8 my-8">
        <div className="rounded-lg bg-slate-50 p-3 shadow-md ring-1 ring-slate-950/5">
          <div>
            <textarea
              placeholder="Chat with your favorite AI model..."
              rows={2}
              className="block w-full resize-none text-slate-900 focus:outline-none"
            />
          </div>
          <div className="flex items-end justify-between">
            <ModelSelect />
            <button className="inline-flex size-6 items-center justify-center rounded-full bg-blue-500">
              <ArrowRightIcon className="size-3.5 stroke-[2.5] text-white" />
            </button>
          </div>
        </div>

        <div className="relative pb-8">
          <div className="absolute -top-[36px] left-[122px] group-has-[[data-open]]:hidden">
            <div className="relative">
              <Arrow className="w-22 -rotate-[15deg] text-red-500" />
              <span className="gochi-hand-regular absolute bottom-[19px] left-[100px] text-xl font-semibold whitespace-nowrap text-red-500">
                Try selecting a model
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const models = [
  {
    id: "gpt-turbo",
    icon: OpenAIIcon,
    name: "GPT Turbo",
    description: "Great for quick responses and general questions.",
    paid: false,
  },
  {
    id: "advanced-reasoning",
    icon: AnthropicIcon,
    name: "Advanced Reasoning",
    description: "Best for complex tasks and detailed analysis.",
    paid: true,
  },
];

function ModelSelect() {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  return (
    <Listbox value={selectedModel} onChange={setSelectedModel}>
      <ListboxButton className="group z-10 -mx-1.5 -my-1.5 inline-flex items-center justify-center rounded px-1.5 py-1.5 text-sm font-medium hover:bg-slate-950/5 focus:outline-none">
        <OpenAIIcon className="mr-1.5 size-4 text-black" />
        <span className="mr-1">{selectedModel.name}</span>
        <ChevronDownIcon className="size-5 text-slate-500 group-data-[hover]:text-slate-600" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="-mx-1.5 mt-3 w-[320px] rounded-md bg-white px-5 py-1.5 shadow-lg ring-1 ring-slate-950/5 data-[open]:outline-none"
      >
        {models.map((model) => (
          <ListboxOption
            key={model.id}
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

function Arrow(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 167 182"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_3_224)">
        <path
          d="M165.373 136.037c-4.338 5.932-10.541 6.909-16.372 7.066a115.576 115.576 0 01-24.171-2.219c-35.938-8.202-63.424-28.864-83.175-59.677-4.994-7.852-8.946-16.548-13.792-25.814C21.64 62.94 20.83 73.43 14.83 81.57c-2.484-3.591-1.469-6.915-.702-9.693 3.193-11.385 6.584-22.845 10.248-34.18 1.807-5.433 4.238-6.8 9.153-4.577 10.301 4.497 18.223 11.7 23.491 21.486.15.396-.222 1.215-.643 2.505-9.355 1.03-11.473-10.62-20.308-11.821 1.972 14.873 9.277 27.06 17.623 38.403 8.769 11.863 18.504 22.683 30.694 30.995 11.918 8.189 24.999 13.45 38.849 17.743 13.726 4.566 27.648 5.438 42.138 3.606z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_3_224">
          <path
            fill="currentColor"
            transform="rotate(159.379 70.554 84.386)"
            d="M0 0H122V148H0z"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

function OpenAIIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 260"
      {...props}
    >
      <path
        fill="currentColor"
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
      />
    </svg>
  );
}

function AnthropicIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      style={{
        flex: "none",
        lineHeight: 1,
      }}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  );
}
