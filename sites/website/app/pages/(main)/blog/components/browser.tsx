import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { MouseEventHandler, ReactNode } from "react";

export function Browser({
  children,
  url,
  onRefresh,
  onBack,
  onForward,
}: {
  children: ReactNode;
  url: string;
  onRefresh?: MouseEventHandler<HTMLButtonElement> | undefined;
  onBack?: MouseEventHandler<HTMLButtonElement> | undefined;
  onForward?: MouseEventHandler<HTMLButtonElement> | undefined;
}) {
  return (
    <div className="relative flex h-full flex-col rounded-lg">
      <div className="relative flex w-full items-center justify-center rounded-t-lg bg-gray-50 px-4 py-2">
        <div className="absolute inset-y-0 left-4 flex items-center justify-center">
          <div className="mr-4 flex items-center space-x-1.5">
            <span className="size-2.5 rounded-full bg-red-400"></span>
            <span className="size-2.5 rounded-full bg-yellow-400"></span>
            <span className="size-2.5 rounded-full bg-green-400"></span>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="flex items-center space-x-1">
              <button
                className={clsx(
                  "p-1 text-gray-500",
                  onBack && "hover:text-gray-800",
                )}
                onClick={onBack}
                aria-label="Back"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                className={clsx(
                  "p-1 text-gray-500",
                  onForward && "hover:text-gray-800",
                )}
                onClick={onForward}
                aria-label="Forward"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="relative mx-3 flex w-[200px] overflow-hidden rounded-md bg-gray-50 px-2.5 py-1.5 text-center text-xs font-medium whitespace-nowrap ring ring-black/10 ring-inset md:w-1/2 md:pr-12">
          <span className="w-full overflow-hidden text-center text-gray-500">
            {url}
          </span>
          <div className="hidden md:block">
            <button
              onClick={onRefresh}
              className={clsx(
                "absolute inset-y-0 right-3 flex items-center p-1 text-gray-500",
                onRefresh && "hover:text-gray-800",
              )}
              aria-label="Refresh"
            >
              <svg
                viewBox="0 0 15 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-3.5"
              >
                <path
                  d="M0 10.601C0 14.706 3.34465 18 7.50424 18C11.6638 18 15 14.706 15 10.601C15 10.1997 14.7114 9.90711 14.2954 9.90711C13.8964 9.90711 13.6333 10.1997 13.6333 10.601C13.6333 13.9619 10.9083 16.654 7.50424 16.654C4.10017 16.654 1.36672 13.9619 1.36672 10.601C1.36672 7.24849 4.10017 4.56479 7.50424 4.56479C8.14941 4.56479 8.75212 4.61496 9.25297 4.732L6.71477 7.20669C6.58744 7.34046 6.51952 7.50766 6.51952 7.68323C6.51952 8.06781 6.80815 8.35207 7.19015 8.35207C7.40238 8.35207 7.56367 8.28518 7.68251 8.15978L11.18 4.69856C11.3328 4.55643 11.3922 4.38922 11.3922 4.19693C11.3922 4.01301 11.3158 3.82908 11.18 3.69531L7.68251 0.20065C7.56367 0.0668834 7.39389 0 7.19015 0C6.80815 0 6.51952 0.300975 6.51952 0.685555C6.51952 0.861124 6.58744 1.02833 6.70628 1.1621L8.96435 3.36089C8.52292 3.27729 8.02207 3.21876 7.50424 3.21876C3.34465 3.21876 0 6.50441 0 10.601Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="absolute inset-y-0 right-4 flex items-center justify-center md:hidden">
          <button
            onClick={onRefresh}
            className={clsx(
              "inline-flex items-center justify-center p-1 text-gray-500",
              onRefresh && "hover:text-gray-800",
            )}
            aria-label="Refresh"
          >
            <svg
              viewBox="0 0 15 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-3.5"
            >
              <path
                d="M0 10.601C0 14.706 3.34465 18 7.50424 18C11.6638 18 15 14.706 15 10.601C15 10.1997 14.7114 9.90711 14.2954 9.90711C13.8964 9.90711 13.6333 10.1997 13.6333 10.601C13.6333 13.9619 10.9083 16.654 7.50424 16.654C4.10017 16.654 1.36672 13.9619 1.36672 10.601C1.36672 7.24849 4.10017 4.56479 7.50424 4.56479C8.14941 4.56479 8.75212 4.61496 9.25297 4.732L6.71477 7.20669C6.58744 7.34046 6.51952 7.50766 6.51952 7.68323C6.51952 8.06781 6.80815 8.35207 7.19015 8.35207C7.40238 8.35207 7.56367 8.28518 7.68251 8.15978L11.18 4.69856C11.3328 4.55643 11.3922 4.38922 11.3922 4.19693C11.3922 4.01301 11.3158 3.82908 11.18 3.69531L7.68251 0.20065C7.56367 0.0668834 7.39389 0 7.19015 0C6.80815 0 6.51952 0.300975 6.51952 0.685555C6.51952 0.861124 6.58744 1.02833 6.70628 1.1621L8.96435 3.36089C8.52292 3.27729 8.02207 3.21876 7.50424 3.21876C3.34465 3.21876 0 6.50441 0 10.601Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative flex h-full min-h-[400px] w-full grow flex-col overflow-hidden rounded-b-lg bg-white">
        {children}
      </div>

      {/* this would look good with a shadow */}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-[0.5px] ring-gray-950/20" />
    </div>
  );
}
