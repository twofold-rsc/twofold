"use server";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Demo5ModelSelect } from "./demo5-model-select";
import { Suspense } from "react";
import Spinner from "../../../../../components/spinner";
import { models } from "./models";

export function getDemo5() {
  return (
    <div className="w-full rounded-lg bg-slate-50 p-3 shadow-md ring-1 ring-slate-950/5">
      <textarea
        placeholder="Chat with your favorite AI model..."
        rows={2}
        className="block w-full resize-none text-slate-900 focus:outline-none"
      />
      <div className="flex items-end justify-between">
        <Suspense fallback={<LoadingModels />}>
          <CurrentUsersModels />
        </Suspense>
        <button className="inline-flex size-6 items-center justify-center rounded-full bg-blue-500">
          <ArrowRightIcon className="size-3.5 stroke-[2.5] text-white" />
        </button>
      </div>
    </div>
  );
}

async function CurrentUsersModels() {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return <Demo5ModelSelect models={models} />;
}

function LoadingModels() {
  return (
    <div className="inline-flex items-center justify-center space-x-1.5 text-sm">
      <Spinner />
      <span className="font-medium">Loading models...</span>
    </div>
  );
}
