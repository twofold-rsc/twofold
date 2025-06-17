"use server";

import { Suspense } from "react";
import Spinner from "../../../../../components/spinner";

export async function getDemo2(formData: FormData) {
  let data = Object.fromEntries(formData.entries());
  let shouldStream = !!data["stream-comments"];

  return (
    <div className="mt-9 px-8 sm:px-34">
      <h2 className="text-xl font-bold tracking-tight">My Blog</h2>
      <p className="mt-4 text-[15px]">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
        fermentum, nisi eget aliquet tincidunt, sapien erat iaculis nisl, nec
        maximus ligula ante non magna. Sed vitae nisi a urna aliquet imperdiet.
        <span className="hidden sm:inline">
          Nullam efficitur a enim sed porttitor. Ut sit amet mi at purus
          interdum.
        </span>
      </p>
      <p className="mt-3 text-[15px]">
        Mauris pharetra euismod euismod. Maecenas lacus nibh, venenatis a
        consectetur eu, semper et augue. Praesent dolor tortor, imperdiet id
        nisl at, convallis tincidunt nisl. Nam nec urna a leo mattis finibus vel
        sed mauris. Vivamus facilisis elit a odio facilisis, id finibus erat
        sodales.
      </p>
      <div className="mt-7">
        <h3 className="text-xl font-bold tracking-tight">Comments</h3>
        <div className="mt-6 pb-8">
          {shouldStream ? (
            <Suspense fallback={<Loading />}>
              <Comments delay={3500} />
            </Suspense>
          ) : (
            <Comments delay={2_500} />
          )}
        </div>
      </div>
    </div>
  );
}

async function Comments({ delay }: { delay: number }) {
  await new Promise((resolve) => setTimeout(resolve, delay));

  return (
    <ul className="space-y-6">
      <Comment
        name="Jane Doe"
        comment="This is a really thoughtful post. Thanks for sharing your perspective — I learned something new!"
      />
      <Comment
        name="Bob Smith"
        comment="I completely agree with your points. This article was very enlightening!"
      />
      <Comment
        name="Alice Johnson"
        comment="You're absolutely right — can you tell I'm an AI generated comment?"
      />
    </ul>
  );
}

function Comment({ name, comment }: { name: string; comment: string }) {
  return (
    <li className="flex gap-3 border-b border-gray-200 pb-5 last:border-b-0 last:pb-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="size-6 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
          />
        </svg>
      </div>
      <div>
        <div className="leading-none font-medium text-gray-900">{name}</div>
        <p className="mt-2 text-sm text-gray-700">{comment}</p>
      </div>
    </li>
  );
}

function Loading() {
  return (
    <div className="my-12 flex items-center justify-center space-x-2">
      <Spinner className="size-4 text-gray-900" />
      <span>Loading comments...</span>
    </div>
  );
}
