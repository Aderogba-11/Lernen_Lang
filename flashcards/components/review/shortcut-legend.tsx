"use client";

import { cn } from "@/lib/utils";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
      {children}
    </kbd>
  );
}

export function ShortcutLegend({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      <span>
        <Key>Space</Key> flip
      </span>
      <span className="hidden sm:inline" aria-hidden>
        ·
      </span>
      <span>
        <Key>1</Key>–<Key>4</Key> rate
      </span>
      <span className="hidden sm:inline" aria-hidden>
        ·
      </span>
      <span>
        <Key>←</Key>/<Key>→</Key> again / easy
      </span>
    </p>
  );
}