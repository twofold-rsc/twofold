"use client";

import { ReactNode, useState } from "react";

export function Reveal({ children }: { children: ReactNode }) {
  let [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <div className={`overflow-hidden ${revealed ? "" : "h-52"}`}>
        {children}
        {!revealed && (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent to-white"></div>
        )}
      </div>

      {!revealed && (
        <button
          className="absolute bottom-0 left-0 w-full py-2 text-center text-blue-500"
          onClick={() => setRevealed(true)}
        >
          Show more
        </button>
      )}
    </div>
  );
}
