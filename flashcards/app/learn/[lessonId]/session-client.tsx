"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  completeLessonAction,
  rateFlashcardAction,
} from "./actions";
import { RATINGS, type LessonSession, type Rating } from "@/lib/sessions";

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

function playCardAudio(targetText: string, audioUrl: string | null) {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.addEventListener("error", () => speakFallback(targetText), { once: true });
    const playback = audio.play();
    if (playback) {
      playback.catch(() => speakFallback(targetText));
    }
    return;
  }
  speakFallback(targetText);
}

function speakFallback(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function SessionClient({ session }: { session: LessonSession }) {
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

  const total = session.cards.length;
  const card = session.cards[index];
  const isLast = index === total - 1;
  const accuracy = useMemo(() => {
    const good = counts.GOOD + counts.EASY;
    return total === 0 ? 0 : Math.round((good / total) * 100);
  }, [counts, total]);

  if (total === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>No cards yet</CardTitle>
          <CardDescription>
            This lesson has no flashcard content published.
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
      await rateFlashcardAction(card.id, rating);
      if (isLast) {
        await completeLessonAction(session.lessonId);
        setFinished(true);
      } else {
        setIndex((prev) => prev + 1);
        setRevealed(false);
      }
    });
  }

  if (finished) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Lesson complete!</CardTitle>
          <CardDescription>
            {session.lessonTitle} · {total} card{total === 1 ? "" : "s"} reviewed
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1 text-sm">
            {RATINGS.map((rating) => (
              <li key={rating} className="flex justify-between">
                <span className="text-zinc-500">{RATING_LABELS[rating]}</span>
                <span className="font-medium">{counts[rating]}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <span className="text-zinc-500">Accuracy (Good + Easy)</span>
            <Badge>{accuracy}%</Badge>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/learn">Back to course</Link>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIndex(0);
                setRevealed(false);
                setCounts({ AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 });
                setFinished(false);
              }}
            >
              Practice again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>
            Module {session.moduleOrder} · Lesson {session.lessonOrder}
          </CardDescription>
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
          <p className="text-3xl font-semibold tracking-tight">{card.targetText}</p>
          {revealed ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-zinc-500">{card.translation}</p>
              {card.pronunciation && (
                <p className="text-zinc-400">[{card.pronunciation}]</p>
              )}
              {card.partOfSpeech && (
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  {card.partOfSpeech}
                </p>
              )}
              {card.exampleSentence && (
                <p className="mt-2 italic text-zinc-600 dark:text-zinc-300">
                  “{card.exampleSentence}”
                </p>
              )}
              {card.exampleTranslation && (
                <p className="text-xs text-zinc-400">{card.exampleTranslation}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Tap reveal to see the meaning</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => playCardAudio(card.targetText, card.audioUrl)}
        >
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
