"use server";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";
import Spinner from "../../../../../components/spinner";
import { models } from "./models";
import {
  Demo6ModelSelect,
  Demo6ModelSelectOptions,
} from "./demo6-model-select";
import { Arrow } from "./arrows";

export function getDemo6() {
  return (
    <div className="group w-full">
      <div className="w-full rounded-lg bg-slate-50 p-3 shadow-md ring-1 ring-slate-950/5">
        <textarea
          placeholder="Chat with your favorite AI model..."
          rows={2}
          className="block w-full resize-none text-base text-slate-900 focus:outline-none sm:text-base"
        />
        <div className="flex items-end justify-between">
          <Demo6ModelSelect>
            <Suspense fallback={<LoadingModels />}>
              <CurrentUsersOptions />
            </Suspense>
          </Demo6ModelSelect>
          <button className="inline-flex size-6 items-center justify-center rounded-full bg-blue-500">
            <ArrowRightIcon className="size-3.5 stroke-[2.5] text-white" />
          </button>
        </div>
      </div>

      <div className="relative pb-8">
        <div className="absolute -top-[24px] left-[24px] group-has-[[data-open]]:hidden sm:-top-[32px] sm:left-[110px]">
          <div className="relative">
            <Arrow className="w-16 -rotate-[8deg] text-red-500 sm:w-22 sm:-rotate-[10deg]" />
            <div className="font-handwriting absolute -bottom-[50px] left-[72px] text-xl font-semibold whitespace-nowrap text-red-500 sm:-bottom-[12px] sm:left-[100px]">
              <p>
                Models are{" "}
                <span className="hidden group-has-[[data-models-loading]]:inline">
                  loading...
                </span>
                <span className="inline group-has-[[data-models-loading]]:hidden">
                  loaded!
                </span>
              </p>
              <p className="hidden sm:block">Open the dropdown and see!</p>
              <p className="block sm:hidden">Open the dropdown</p>
              <p className="block sm:hidden">and see!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingModels() {
  return (
    <div
      className="flex min-h-[232px] flex-col items-center justify-center space-y-3"
      data-models-loading
    >
      <Spinner className="size-4 font-normal" />
      <p className="text-sm font-normal text-slate-600">Loading models...</p>
    </div>
  );
}

async function CurrentUsersOptions() {
  await new Promise((resolve) => setTimeout(resolve, 6000));

  return <Demo6ModelSelectOptions models={models} />;
}
