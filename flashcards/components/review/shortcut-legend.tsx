"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
      {children}
    </kbd>
  );
}

export type ShortcutItem = {
  keys: ReactNode;
  label: string;
};

export function ShortcutLegend({
  items,
  className,
  footer = false,
}: {
  items: ShortcutItem[];
  className?: string;
  footer?: boolean;
}) {
  const content = (
    <p
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
          )}
          <span>
            <Key>{item.keys}</Key> {item.label}
          </span>
        </Fragment>
      ))}
    </p>
  );

  if (footer) {
    return (
      <div className="sticky bottom-0 z-30 mt-auto -mx-1 flex items-center justify-center rounded-xl border border-border bg-background/90 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {content}
      </div>
    );
  }

  return content;
}