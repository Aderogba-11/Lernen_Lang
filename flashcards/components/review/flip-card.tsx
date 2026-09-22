"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function startedInAction(e: React.MouseEvent<HTMLDivElement>): boolean {
  return (e.target as HTMLElement).closest?.("[data-no-flip]") != null;
}

export function FlipCard({
  front,
  back,
  flipped,
  onFlip,
  disabled = false,
  className,
  frontClassName,
  backClassName,
  "aria-label": ariaLabel,
}: {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
  disabled?: boolean;
  className?: string;
  frontClassName?: string;
  backClassName?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={cn("relative [perspective:1400px]", className)} data-testid="flip-perspective">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={flipped}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if (disabled || startedInAction(e)) return;
          onFlip();
        }}
        onKeyDown={(e) => {
          if (disabled || e.target !== e.currentTarget) return;
          if (e.key === "Enter") {
            e.preventDefault();
            onFlip();
          }
        }}
        className={cn(
          "absolute inset-0 cursor-pointer rounded-2xl outline-none transition-transform duration-500 will-change-transform [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-ring/50",
          flipped && "[transform:rotateY(180deg)]",
          disabled && "cursor-default",
        )}
        data-testid="flip-inner"
      >
        <div
          className={cn("absolute inset-0 [backface-visibility:hidden]", frontClassName)}
          data-testid="flip-front"
        >
          {front}
        </div>
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            backClassName,
          )}
          data-testid="flip-back"
        >
          {back}
        </div>
      </div>
    </div>
  );
}