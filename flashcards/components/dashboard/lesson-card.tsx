import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Play,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LessonCardData = {
  id: string;
  title: string;
  /** CEFR band tag, e.g. "A1", "B2". */
  level: string;
  meta?: string;
  /** 0–100 completion percentage. */
  pct: number;
  href: string;
  completed?: boolean;
  streakBoost?: boolean;
  className?: string;
};

type LessonAction = "start" | "continue" | "revisit";

const ACTION_META: Record<LessonAction, { label: string; Icon: LucideIcon }> = {
  start: { label: "Start", Icon: Play },
  continue: { label: "Continue", Icon: ChevronRight },
  revisit: { label: "Revisit", Icon: RefreshCw },
};

const LEVEL_STYLES: Record<string, string> = {
  A1: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  A2: "bg-teal-500/10 text-teal-600 ring-teal-500/20 dark:text-teal-400",
  B1: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  B2: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400",
  C1: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  C2: "bg-fuchsia-500/10 text-fuchsia-600 ring-fuchsia-500/20 dark:text-fuchsia-400",
};

const FALLBACK = "bg-muted text-muted-foreground";

export function LessonCard({
  id,
  title,
  level,
  meta,
  pct,
  href,
  completed = false,
  streakBoost = false,
  className,
}: LessonCardData) {
  const clamped = Math.min(Math.max(Math.round(pct), 0), 100);
  const action: LessonAction = completed
    ? "revisit"
    : clamped > 0
      ? "continue"
      : "start";
  const { label: actionLabel, Icon: ActionIcon } = ACTION_META[action];
  const flag = LEVEL_STYLES[level] ?? FALLBACK;

  return (
    <Link
      href={href}
      aria-label={`${actionLabel}: ${title}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
            "group-hover:bg-primary/10 group-hover:text-primary"
          )}
          aria-hidden
        >
          <BookOpen className="size-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset",
            flag
          )}
        >
          {level}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </div>

      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} progress`}
      >
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-[width] duration-500"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {clamped}%
        </span>
      </div>

      <span className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
        <ActionIcon className="size-4" aria-hidden />
        {actionLabel}
        {streakBoost && (
          <span
            className="relative flex size-1.5"
            title="Streak boost"
            aria-label="Streak boost"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-reward opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-reward" />
          </span>
        )}
      </span>
    </Link>
  );
}

export function LessonCardGrid({
  items,
  className,
}: {
  items: LessonCardData[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <LessonCard key={item.id} {...item} />
      ))}
    </div>
  );
}
