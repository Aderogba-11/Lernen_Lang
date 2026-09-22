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

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

const RATING_KEY_LABELS: Record<Rating, string> = {
  AGAIN: "1",
  HARD: "2",
  GOOD: "3",
  EASY: "4",
};

const RATING_BUTTON_STYLES: Record<Rating, string> = {
  AGAIN: "outline-ring hover:border-destructive/60 hover:text-destructive",
  HARD: "outline",
  GOOD: "default",
  EASY: "outline-success hover:border-success/60 hover:text-success",
};

type AudioStatus = "idle" | "loading" | "playing";

export function ReviewSession({ queue }: { queue: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<Rating, number>>({
    AGAIN: 0,
    HARD: 0,
    GOOD: 0,
    EASY: 0,
  });
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = queue.length;
  const card = queue[index];
  const isLast = index === total - 1;
  const accuracy = useMemo(() => {
    const good = counts.GOOD + counts.EASY;
    return total === 0 ? 0 : Math.round((good / total) * 100);
  }, [counts, total]);

  function speak(targetText: string, langCode: string) {
    if (!("speechSynthesis" in window)) {
      setAudioStatus("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(targetText);
    u.lang = langCode;
    u.rate = 0.85;
    u.onend = () => setAudioStatus("idle");
    window.speechSynthesis.speak(u);
    setAudioStatus("playing");
  }

  function playAudio(card: ReviewCard) {
    setAudioStatus("loading");
    if (card.audioUrl) {
      const a = new Audio(card.audioUrl);
      a.addEventListener("playing", () => setAudioStatus("playing"), { once: true });
      a.addEventListener("ended", () => setAudioStatus("idle"), { once: true });
      a.addEventListener("error", () => speak(card.targetText, card.languageCode), { once: true });
      a.play().catch(() => speak(card.targetText, card.languageCode));
      return;
    }
    speak(card.targetText, card.languageCode);
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || pending || !card) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed((prev) => !prev);
        return;
      }
      if (!revealed) return;
      const byKey: Record<string, Rating> = {
        "1": "AGAIN",
        "2": "HARD",
        "3": "GOOD",
        "4": "EASY",
      };
      const rating = byKey[e.key];
      if (rating) handleRate(rating);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, pending, revealed, index, card]);

  if (total === 0) {
    return (
      <Card className="w-full max-w-md animate-pop-in">
        <CardHeader>
          <CardTitle>All caught up</CardTitle>
          <CardDescription>
            No cards are due right now — nice work keeping up. New cards appear
            here as soon as they are ready.
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

  if (finished) {
    const accuracyLabel =
      accuracy >= 80 ? "Excellent recall!" : accuracy >= 60 ? "Good work!" : "Keep reviewing";
    return (
      <Card className="w-full max-w-md animate-pop-in">
        <CardHeader>
          <CardTitle>Review complete</CardTitle>
          <CardDescription>
            You reviewed {total} card{total === 1 ? "" : "s"} with {accuracy}% accuracy.
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
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="sticky top-0 z-30 -mx-1 flex flex-col gap-2 rounded-xl border border-border bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="font-medium">
              Card {index + 1}
            </span>
            <span className="text-muted-foreground">/ {total}</span>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground"
          >
            <Link href="/dashboard">
              <LogOut className="h-4 w-4" aria-hidden />
              End session
            </Link>
          </Button>
        </div>
        <Progress value={(index / total) * 100} />
      </div>

      <FlipCard
        flipped={revealed}
        aria-label={`Flashcard ${index + 1} of ${total}${
          revealed ? ", answer revealed" : ""
        }`}
        front={
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-3xl font-semibold tracking-tight">
              {card.targetText}
            </p>
            <button
              type="button"
              onClick={() =>
                playAudio(card)
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-pressed={audioStatus === "playing"}
              aria-label="Play audio"
            >
              {audioStatus === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Volume2
                  className={`h-4 w-4 ${audioStatus === "playing" ? "animate-pulse" : ""}`}
                  aria-hidden
                />
              )}
              {audioStatus === "loading"
                ? "Loading"
                : audioStatus === "playing"
                  ? "Playing"
                  : "Play audio"}
            </button>
            <p className="text-xs text-muted-foreground">
              Press{" "}
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                Space
              </kbd>{" "}
              or tap to reveal
            </p>
          </div>
        }
        back={
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex flex-col gap-1.5">
              <p className="text-xl font-medium">{card.translation}</p>
              {card.pronunciation && (
                <p className="text-sm text-muted-foreground">
                  [{card.pronunciation}]
                </p>
              )}
              {card.exampleSentence && (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  &quot;{card.exampleSentence}&quot;
                </p>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
              {RATINGS.map((rating) => (
                <Button
                  key={rating}
                  variant={RATING_BUTTON_STYLES[rating] === "default" ? "default" : "outline"}
                  className={
                    RATING_BUTTON_STYLES[rating] === "default"
                      ? undefined
                      : `transition-all active:scale-[0.98] ${RATING_BUTTON_STYLES[rating]}`
                  }
                  disabled={pending}
                  onClick={() => handleRate(rating)}
                >
                  <span className="flex flex-col leading-tight">
                    <span>{RATING_LABELS[rating]}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {RATING_KEY_LABELS[rating]}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        }
      />

      <p className="text-center text-xs text-muted-foreground">
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          Space
        </kbd>{" "}
        flip ·{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          1
        </kbd>
        –
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          4
        </kbd>{" "}
        rate
      </p>
    </div>
  );
}
