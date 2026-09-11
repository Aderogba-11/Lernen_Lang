import { cn } from "@/lib/utils";

const TINTS = [
  "bg-primary/15 text-primary",
  "bg-reward/15 text-reward",
  "bg-success/15 text-success",
  "bg-accent text-accent-foreground",
];

function tintFor(code: string): string {
  let sum = 0;
  for (const ch of code) sum += ch.charCodeAt(0);
  return TINTS[sum % TINTS.length];
}

export function LanguageFlag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const letters = (code || "?").slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide ring-1 ring-foreground/5",
        tintFor(code),
        className,
      )}
    >
      {letters}
    </span>
  );
}