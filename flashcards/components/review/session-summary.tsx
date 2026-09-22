"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RATINGS, type Rating } from "@/lib/ratings";

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

export function EmptyDeck() {
  return (
    <Card className="w-full max-w-md animate-pop-in">
      <CardHeader>
        <CardTitle>All caught up</CardTitle>
        <CardDescription>
          No cards are due right now — nice work keeping up. New cards appear
          here as soon as they are ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/learn">Back to course</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function SessionComplete({
  total,
  counts,
  accuracy,
}: {
  total: number;
  counts: Record<Rating, number>;
  accuracy: number;
}) {
  return (
    <Card className="w-full max-w-md animate-pop-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <CardTitle className="text-2xl">Session complete! 🎉</CardTitle>
        <CardDescription>
          You reviewed {total} card{total === 1 ? "" : "s"} with {accuracy}%
          accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 text-sm">
          {RATINGS.map((rating) => (
            <div key={rating} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">{RATING_LABELS[rating]}</span>
              <span>{counts[rating]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Accuracy (Good + Easy)</span>
          <Badge>{accuracy}%</Badge>
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/review">Review more</Link>
        </Button>
      </CardContent>
    </Card>
  );
}