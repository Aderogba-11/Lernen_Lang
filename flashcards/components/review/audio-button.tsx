"use client";

import { Loader2, Volume2 } from "lucide-react";
import type { AudioStatus } from "@/lib/speech";
import { cn } from "@/lib/utils";

export function AudioButton({
  status,
  onPlay,
  disabled = false,
  className,
}: {
  status: AudioStatus;
  onPlay: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const loading = status === "loading";
  const playing = status === "playing";
  return (
    <button
      type="button"
      data-no-flip
      onClick={onPlay}
      disabled={disabled}
      aria-pressed={playing}
      aria-label={loading ? "Loading audio" : playing ? "Audio playing" : "Play audio"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Volume2
          className={cn("h-4 w-4", playing && "animate-pulse text-primary")}
          aria-hidden
        />
      )}
      {loading ? "Loading" : playing ? "Playing" : "Play audio"}
    </button>
  );
}