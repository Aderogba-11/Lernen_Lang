"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { rateReviewCard } from "@/app/(app)/review/actions";
import { FlashCard } from "@/components/flashcards/flash-card";
import { SessionHeader } from "@/components/review/session-header";
import { ShortcutLegend } from "@/components/review/shortcut-legend";
import {
  EmptyDeck,
  SessionComplete,
} from "@/components/review/session-summary";
import { type Rating } from "@/lib/ratings";
import type { ReviewCard } from "@/lib/review";

const INITIAL_COUNTS: Record<Rating, number> = {
  AGAIN: 0,
  HARD: 0,
  GOOD: 0,
  EASY: 0,
};

export function ReviewSession({ queue }: { queue: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<Rating, number>>(INITIAL_COUNTS);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = queue.length;
  const card = queue[index];
  const isLast = index === total - 1;

  const accuracy = useMemo(() => {
    const good = counts.GOOD + counts.EASY;
    return total === 0 ? 0 : Math.round((good / total) * 100);
  }, [counts, total]);

  function handleRate(rating: Rating) {
    if (!revealed || pending || !card) return;
    startTransition(async () => {
      const result = await rateReviewCard(card.id, rating);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCounts((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
      if (isLast) {
        setFinished(true);
      } else {
        setIndex((prev) => prev + 1);
        setRevealed(false);
      }
    });
  }

  function toggleFlip() {
    if (pending || finished) return;
    setRevealed((prev) => !prev);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || pending || !card) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.("button, a, input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed((prev) => !prev);
        return;
      }
      if (!revealed) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleRate("AGAIN");
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleRate("EASY");
        return;
      }
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
    return <EmptyDeck />;
  }

  if (finished) {
    return (
      <SessionComplete total={total} counts={counts} accuracy={accuracy} />
    );
  }

  return (
    <div className="flex w-full max-w-md flex-1 flex-col gap-4">
      <SessionHeader index={index} total={total} />

      <FlashCard
        key={card.id}
        card={card}
        index={index}
        total={total}
        languageCode={card.languageCode}
        flipped={revealed}
        onFlip={toggleFlip}
        disabled={pending}
        pending={pending}
        onRate={handleRate}
      />

      <ShortcutLegend
        footer
        items={[
          { keys: "Space", label: "flip" },
          { keys: "1–4", label: "rate" },
          { keys: "←/→", label: "again / easy" },
        ]}
      />
    </div>
  );
}