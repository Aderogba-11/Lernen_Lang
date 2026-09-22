"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { rateReviewCard } from "@/app/(app)/review/actions";
import { RATINGS, type Rating } from "@/lib/ratings";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FlipCard } from "@/components/review/flip-card";
import { Loader2, LogOut, Volume2 } from "lucide-react";
import type { ReviewCard } from "@/lib/review";

const RATING_KEY_LABELS: Record<Rating, string> = {
  AGAIN: "1",
  HARD: "2",
  GOOD: "3",
  EASY: "4",
};

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

const RATING_BUTTON_STYLES: Record<Rating, string> = {
  AGAIN: "outline-ring hover:border-destructive/60 hover:text-destructive",
  HARD: "outline",
  GOOD: "default",
  EASY: "outline-success hover:border-success/60 hover:text-success",
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

  function playAudio(audioUrl: string | null, targetText: string, langCode: string) {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.addEventListener(
        "error",
        () => {
          if (!("speechSynthesis" in window)) return;
          const u = new SpeechSynthesisUtterance(targetText);
          u.lang = langCode;
          u.rate = 0.85;
          window.speechSynthesis.speak(u);
        },
        { once: true },
      );
      a.play().catch(() => {
        if (!("speechSynthesis" in window)) return;
        const u = new SpeechSynthesisUtterance(targetText);
        u.lang = langCode;
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      });
      return;
    }
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(targetText);
    u.lang = langCode;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  if (finished) {
    const accuracyLabel =
      accuracy >= 80 ? "Excellent recall!" : accuracy >= 60 ? "Good work!" : "Keep reviewing";
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
          <CardTitle className="text-2xl">Review complete! 🎉</CardTitle>
          <CardDescription>
            You reviewed {total} card{total === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm text-muted-foreground">Accuracy</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold text-success">{accuracy}%</span>
              <span className="text-sm text-muted-foreground">{accuracyLabel}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {RATINGS.map((rating) => (
              <div
                key={rating}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <span className="font-medium text-foreground">
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
    <Card className="w-full max-w-md animate-card-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>Review</CardDescription>
          <span className="text-sm font-medium text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
        <Progress value={(index / total) * 100} />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 p-6 text-center">
          <p className="text-3xl font-semibold tracking-tight">
            {card.targetText}
          </p>
          {revealed ? (
            <div className="flex animate-flash-reveal flex-col gap-1 text-sm">
              <p className="text-muted-foreground">{card.translation}</p>
              {card.pronunciation && (
                <p className="text-muted-foreground/70">[{card.pronunciation}]</p>
              )}
              {card.exampleSentence && (
                <p className="mt-2 italic text-foreground/80">
                  {"\u201c"}{card.exampleSentence}{"\u201d"}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tap reveal to see the meaning
            </p>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={() => playAudio(card.audioUrl, card.targetText, card.languageCode)}>
          Play audio
        </Button>

        {revealed ? (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((rating) => (
              <Button
                key={rating}
                variant={
                  RATING_BUTTON_STYLES[rating] === "default"
                    ? "default"
                    : "outline"
                }
                className={
                  RATING_BUTTON_STYLES[rating] === "default"
                    ? undefined
                    : `transition-all active:scale-[0.98] ${RATING_BUTTON_STYLES[rating]}`
                }
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
