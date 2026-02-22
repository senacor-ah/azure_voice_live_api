'use client';

import { Phone } from "lucide-react";

export function Greeting({ isSessionActive = true }: { isSessionActive?: boolean }) {
  return (
    <div className="mx-auto mt-4 flex w-full flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-500">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Phone className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-xl font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
        Hallo!
      </p>
      <p className="mt-1 text-base text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        {isSessionActive
          ? "Wie kann ich dir helfen?"
          : "Starte eine Voice Session um zu beginnen."}
      </p>
    </div>
  );
}
