"use client";

import { SerwistProvider as SP } from "@serwist/next/react";
import type { ReactNode } from "react";

export function SerwistProvider({ children }: { children: ReactNode }) {
  return (
    <SP
      swUrl="/sw.js"
      options={{
        scope: "/",
      }}
    >
      {children}
    </SP>
  );
}
