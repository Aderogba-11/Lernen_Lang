import { cn } from "@/lib/utils";

type ProgressVariant = "primary" | "success" | "reward";

const VARIANTS: Record<ProgressVariant, string> = {
  primary: "bg-primary",
  success: "bg-success",
  reward: "bg-reward",
};

export function Progress({
  value,
  variant = "primary",
  className,
  fillClassName,
  animate = true,
}: {
  value: number;
  variant?: ProgressVariant;
  className?: string;
  fillClassName?: string;
  animate?: boolean;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full",
          VARIANTS[variant],
          animate && "animate-progress-fill",
          fillClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}