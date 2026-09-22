"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function FlipCard({
  front,
  back,
  flipped,
  className,
  frontClassName,
  backClassName,
  role = "button",
  "aria-label": ariaLabel,
}: {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  className?: string;
  frontClassName?: string;
  backClassName?: string;
  role?: "group" | "button";
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn("[perspective:1400px]", className)}
      data-testid="flip-perspective"
    >
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-500 will-change-transform [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]"
        )}
        role={role}
        aria-label={ariaLabel}
        data-testid="flip-inner"
      >
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden]",
            frontClassName
          )}
          data-testid="flip-front"
        >
          {front}
        </div>
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            backClassName
          )}
          data-testid="flip-back"
        >
          {back}
        </div>
      </div>
    </div>
  );
}
