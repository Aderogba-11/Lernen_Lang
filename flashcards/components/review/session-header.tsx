"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function SessionHeader({
  index,
  total,
}: {
  index: number;
  total: number;
}) {
  const current = index + 1;
  return (
    <div className="sticky top-0 z-30 -mx-1 flex flex-col gap-2 rounded-xl border border-border bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-medium">Card {current}</span>
          <span className="text-muted-foreground"> / {total}</span>
        </p>
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href="/dashboard">
            <LogOut className="h-4 w-4" aria-hidden />
            End session
          </Link>
        </Button>
      </div>
      <Progress value={(index / total) * 100} aria-hidden />
    </div>
  );
}