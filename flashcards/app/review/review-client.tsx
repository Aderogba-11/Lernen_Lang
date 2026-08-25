"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { rateReviewCard } from "@/app/review/actions";
import { RATINGS, type Rating } from "@/lib/ratings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReviewCard } from "@/lib/review";

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

export function ReviewSession({ queue }: { queue: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<Rating, number>>({
    AGAIN: 0,
    HARD: 0,
    GOOD: 0,
    EASY: 0,
  });
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = queue.length;
  const card = queue[index];
  const isLast = index === total - 1;
  const accuracy = useMemo(() => {
    const good = counts.GOOD + counts.EASY;
    return total === 0 ? 0 : Math.round((good / total) * 100);
  }, [counts, total]);

  if (total === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>All caught up</CardTitle>
          <CardDescription>
            No cards to review right now. Come back later when cards are due.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/learn">Back to course</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handleRate(rating: Rating) {
    if (!revealed || pending || !card) return;
    setCounts((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    startTransition(async () => {
      await rateReviewCard(card.id, rating);
      if (isLast) {
        setFinished(true);
      } else {
        setIndex((prev) => prev + 1);
        setRevealed(false);
      }
    });
  }

  function playAudio() {
    if (card.audioUrl) {
      const a = new Audio(card.audioUrl);
      a.play().catch(() => {});
      return;
    }
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(card.targetText);
    u.lang = "es";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  if (finished) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Review complete</CardTitle>
          <CardDescription>
            You reviewed {total} card{total === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <span className="text-sm text-zinc-500">Accuracy</span>
            <span className="font-medium">{accuracy}%</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {RATINGS.map((rating) => (
              <div
                key={rating}
                className="flex items-center gap-1.5 text-zinc-500"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {RATING_LABELS[rating]}
                </span>
                <span>{counts[rating]}</span>
              </div>
            ))}
          </div>
          <Button asChild className="w-full">
            <Link href="/review">Review more</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/learn">Back to course</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>Review</CardDescription>
          <span className="text-sm font-medium text-zinc-500">
            {index + 1} / {total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <p className="text-3xl font-semibold tracking-tight">
            {card.targetText}
          </p>
          {revealed ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-zinc-500">{card.translation}</p>
              {card.pronunciation && (
                <p className="text-zinc-400">[{card.pronunciation}]</p>
              )}
              {card.exampleSentence && (
                <p className="mt-2 italic text-zinc-600 dark:text-zinc-300">
                  {"\u201c"}{card.exampleSentence}{"\u201d"}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              Tap reveal to see the meaning
            </p>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={playAudio}>
          Play audio
        </Button>

        {revealed ? (
          <div className="grid w-full grid-cols-4 gap-2">
            {RATINGS.map((rating) => (
              <Button
                key={rating}
                variant={rating === "GOOD" ? "default" : "outline"}
                disabled={pending}
                onClick={() => handleRate(rating)}
              >
                {RATING_LABELS[rating]}
              </Button>
            ))}
          </div>
        ) : (
          <Button className="w-full" onClick={() => setRevealed(true)}>
            Reveal answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
