import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatCardData = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
  /** 0–100; renders a progress bar when set. */
  pct?: number;
  accent?: "primary" | "success" | "reward";
  className?: string;
};

const ICON_CHIP: Record<NonNullable<StatCardData["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  reward: "bg-reward/10 text-reward",
};

const BAR_COLOR: Record<NonNullable<StatCardData["accent"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  reward: "bg-reward",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  pct,
  accent = "primary",
  className,
}: StatCardData) {
  const clamped = Math.min(Math.max(Math.round(pct ?? 0), 0), 100);
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md dark:hover:shadow-primary/5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              ICON_CHIP[accent]
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {typeof pct === "number" && (
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", BAR_COLOR[accent])}
            style={{ width: `${clamped}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function StatsGrid({
  items,
  className,
}: {
  items: StatCardData[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <StatCard key={item.id} {...item} />
      ))}
    </div>
  );
}
