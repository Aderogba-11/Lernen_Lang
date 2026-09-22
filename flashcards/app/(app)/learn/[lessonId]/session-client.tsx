"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ZapIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FlashCard } from "@/components/flashcards/flash-card";
import { ShortcutLegend } from "@/components/review/shortcut-legend";
import { completeLessonAction, rateFlashcardAction, scoreListeningAction, scoreReadingAction, scoreSpeakingAction, scoreWritingAction } from "./actions";
import { RATINGS, type Rating } from "@/lib/ratings";
import type { LessonSession, SessionListening, SessionReading, SessionSpeaking, SessionWriting } from "@/lib/sessions";
import { isSpeechRecognitionSupported, listenForSpeech } from "@/lib/speech";
import type { ReadingScore } from "@/lib/scoring";
import { XP_LESSON } from "@/lib/xp-constants";

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

type McqQuestion = { prompt: string; options: string[] };

function McqQuestions({
  questions,
  selections,
  result,
  onSelect,
}: {
  questions: McqQuestion[];
  selections: number[];
  result: (ReadingScore & { ok: true }) | null;
  onSelect: (questionIndex: number, optionIndex: number) => void;
}) {
  return (
    <ol className="flex flex-col gap-5">
      {questions.map((question, qIndex) => (
        <li key={qIndex} className="flex flex-col gap-2">
          <span className="font-medium">
            {qIndex + 1}. {question.prompt}
            {result && (
              <span className={result.results[qIndex] ? " text-success" : " text-destructive"}>
                {result.results[qIndex] ? " ✓" : " ✗"}
              </span>
            )}
          </span>
          <div className="flex flex-col gap-1.5">
            {question.options.map((option, oIndex) => {
              const isSelected = selections[qIndex] === oIndex;
              const isCorrect = result && result.correctAnswers[qIndex] === oIndex;
              return (
                <label
                  key={oIndex}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/25"
                      : "border-border"
                  } ${isCorrect ? "border-success text-success dark:text-success" : ""}`}
                >
                  <input
                    type="radio"
                    name={`q-${qIndex}`}
                    className="accent-primary"
                    checked={isSelected}
                    disabled={!!result}
                    onChange={() => onSelect(qIndex, oIndex)}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </li>
      ))}
    </ol>
  );
}

function useMcq(count: number) {
  const [selections, setSelections] = useState<number[]>(Array(count).fill(-1));
  const [result, setResult] = useState<(ReadingScore & { ok: true }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const allAnswered = selections.every((s) => s >= 0);
  const select = (qIndex: number, oIndex: number) =>
    setSelections((prev) => prev.map((s, i) => (i === qIndex ? oIndex : s)));

  return { selections, result, error, submitting, allAnswered, select, setResult, setError, startSubmit };
}

function playCardAudio(targetText: string, audioUrl: string | null, langCode?: string) {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.addEventListener("error", () => speakFallback(targetText, langCode), { once: true });
    const playback = audio.play();
    if (playback) {
      playback.catch(() => speakFallback(targetText, langCode));
    }
    return;
  }
  speakFallback(targetText, langCode);
}

function speakFallback(text: string, langCode?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode || "es-ES";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function SessionClient({
  session,
  nextLesson = null,
}: {
  session: LessonSession;
  nextLesson: { id: string; title: string } | null;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"cards" | "writing" | "reading" | "listening" | "speaking">("cards");
  const [writingIndex, setWritingIndex] = useState(0);
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

  function toggleFlip() {
    if (pending) return;
    setRevealed((prev) => !prev);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (phase !== "cards" || finished || pending || !card) return;
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
  }, [phase, finished, pending, revealed, index, card]);

  function nextPhaseAfterCards() {
    if (session.writings.length > 0) return "writing" as const;
    if (session.reading) return "reading" as const;
    if (session.listening) return "listening" as const;
    return null;
  }

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
        const next = nextPhaseAfterCards();
        if (next) {
          setPhase(next);
        } else {
          await completeLessonAction(session.lessonId);
          setFinished(true);
        }
      } else {
        setIndex((prev) => prev + 1);
        setRevealed(false);
      }
    });
  }

  function handleWritingDone() {
    startTransition(async () => {
      if (writingIndex < session.writings.length - 1) {
        setWritingIndex((prev) => prev + 1);
        return;
      }
      if (session.reading) {
        setPhase("reading");
      } else if (session.listening) {
        setPhase("listening");
      } else if (session.speaking) {
        setPhase("speaking");
      } else {
        await completeLessonAction(session.lessonId);
        setFinished(true);
      }
    });
  }

  function handleReadingDone() {
    startTransition(async () => {
      if (session.listening) {
        setPhase("listening");
      } else if (session.speaking) {
        setPhase("speaking");
      } else {
        await completeLessonAction(session.lessonId);
        setFinished(true);
      }
    });
  }

  function handleListeningDone() {
    startTransition(async () => {
      if (session.speaking) {
        setPhase("speaking");
      } else {
        await completeLessonAction(session.lessonId);
        setFinished(true);
      }
    });
  }

  function handleSpeakingDone() {
    startTransition(async () => {
      await completeLessonAction(session.lessonId);
      setFinished(true);
    });
  }

  if (finished) {
    const accuracyLabel =
      accuracy >= 80 ? "Outstanding!" : accuracy >= 60 ? "Well done!" : "Keep practicing";
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
          <CardTitle className="text-2xl">Lesson complete! 🎉</CardTitle>
          <CardDescription>
            {session.lessonTitle} · {total} card{total === 1 ? "" : "s"} reviewed
          </CardDescription>
          <div className="mx-auto mt-2 flex animate-xp-pop items-center gap-1.5 rounded-full bg-reward/15 px-4 py-1.5 text-sm font-semibold text-reward ring-1 ring-reward/25">
            <ZapIcon className="h-4 w-4" />
            +{XP_LESSON} XP earned
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1.5 text-sm">
            {RATINGS.map((rating) => (
              <li key={rating} className="flex justify-between">
                <span className="text-muted-foreground">{RATING_LABELS[rating]}</span>
                <span className="font-medium">{counts[rating]}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Accuracy (Good + Easy)</span>
            <span className="flex items-center gap-2">
              <Badge>{accuracy}%</Badge>
              <span className="font-medium text-success">{accuracyLabel}</span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {nextLesson && (
              <Button asChild className="w-full">
                <Link href={`/learn/${nextLesson.id}`}>Next lesson</Link>
              </Button>
            )}
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
                  setPhase("cards");
                  setWritingIndex(0);
                  setCounts({ AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 });
                  setFinished(false);
                }}
              >
                Practice again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "writing" && session.writings[writingIndex]) {
    return (
      <WritingStep
        key={session.writings[writingIndex].id}
        lessonId={session.lessonId}
        writing={session.writings[writingIndex]}
        stepNumber={writingIndex + 1}
        stepTotal={session.writings.length}
        pending={pending}
        onDone={handleWritingDone}
      />
    );
  }

  if (phase === "reading" && session.reading) {
    return (
      <ReadingStep
        lessonId={session.lessonId}
        reading={session.reading}
        pending={pending}
        onDone={handleReadingDone}
      />
    );
  }

  if (phase === "listening" && session.listening) {
    return (
      <ListeningStep
        lessonId={session.lessonId}
        listening={session.listening}
        pending={pending}
        onDone={handleListeningDone}
      />
    );
  }

  if (phase === "speaking" && session.speaking) {
    return (
      <SpeakingStep
        lessonId={session.lessonId}
        speaking={session.speaking}
        pending={pending}
        languageCode={session.languageCode}
        onDone={handleSpeakingDone}
      />
    );
  }

  return (
    <div className="flex w-full max-w-md animate-card-in flex-col gap-4">
      <div className="flex items-center justify-between">
        <CardDescription>
          Module {session.moduleOrder} · Lesson {session.lessonOrder}
        </CardDescription>
        <span className="text-sm font-medium text-muted-foreground">
          Card {index + 1} / {total}
        </span>
      </div>
      <Progress value={(index / total) * 100} />
      <FlashCard
        key={card.id}
        card={card}
        index={index}
        total={total}
        languageLabel={
          session.levelCode
            ? `${session.languageName} · ${session.levelCode}`
            : session.languageName
        }
        languageCode={session.languageCode}
        flipped={revealed}
        onFlip={toggleFlip}
        disabled={pending}
        pending={pending}
        onRate={handleRate}
      />
      <ShortcutLegend
        items={[
          { keys: "Space", label: "flip" },
          { keys: "1–4", label: "rate" },
          { keys: "←/→", label: "again / easy" },
        ]}
      />
    </div>
  );
}

function WritingStep({
  lessonId,
  writing,
  stepNumber,
  stepTotal,
  pending,
  onDone,
}: {
  lessonId: string;
  writing: SessionWriting;
  stepNumber: number;
  stepTotal: number;
  pending: boolean;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ correct: boolean; expected: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (!value.trim() || submitting || result) return;
    setError(null);
    startSubmit(async () => {
      const scored = await scoreWritingAction(lessonId, writing.id, value);
      if (scored.ok) {
        setResult(scored);
      } else {
        setError(scored.error);
      }
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!result) return;
      if (e.key === "Enter" || e.code === "Space") {
        e.preventDefault();
        onDone();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result, onDone]);

  return (
    <Card className="w-full max-w-2xl animate-card-in">
      <CardHeader>
        <CardDescription>
          Writing {stepNumber} / {stepTotal}
        </CardDescription>
        <CardTitle>{writing.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="rounded-lg border border-border bg-muted/30 p-4 text-base">
          {writing.display}
        </p>

        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-transparent p-3 text-base outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/25"
          placeholder="Type your answer…"
          value={value}
          disabled={!!result || submitting}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result ? (
          <div className="flex flex-col gap-3">
            <p
              className={`flex items-center gap-2 text-sm font-semibold ${
                result.correct
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {result.correct ? "Correct!" : "Not quite."}
            </p>
            {!result.correct && (
              <p className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                Expected answer:{" "}
                <span className="font-medium">{result.expected}</span>
              </p>
            )}
            <Button onClick={onDone} disabled={pending}>
              Continue
            </Button>
          </div>
        ) : (
          <Button onClick={handleSubmit} disabled={!value.trim() || submitting}>
            Check answer
          </Button>
        )}
      </CardContent>
      <ShortcutLegend
        items={[{ keys: "Enter", label: result ? "continue" : "check" }]}
        className="pb-5"
      />
    </Card>
  );
}

function SpeakingStep({
  lessonId,
  speaking,
  pending,
  languageCode,
  onDone,
}: {
  lessonId: string;
  speaking: SessionSpeaking;
  pending: boolean;
  languageCode: string;
  onDone: () => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; expected: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [submitting, startSubmit] = useTransition();

  function submit(value: string) {
    if (!value.trim() || submitting || result) return;
    setError(null);
    startSubmit(async () => {
      const scored = await scoreSpeakingAction(lessonId, speaking.id, value);
      if (scored.ok) {
        setTranscript(value);
        setResult(scored);
      } else {
        setError(scored.error);
      }
    });
  }

  async function handleMic() {
    if (listening || result) return;
    setError(null);
    setListening(true);
    try {
      const heard = await listenForSpeech("es-ES");
      submit(heard);
    } catch (e) {
      const code = e instanceof Error ? e.message : "speech-error";
      setError(
        code === "unsupported"
          ? "Speech recognition is not supported in this browser — type your answer below instead."
          : code === "not-allowed"
            ? "Microphone access was denied — type your answer below instead."
            : "Didn't catch that. Try again or type your answer below.",
      );
    } finally {
      setListening(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!result) return;
      if (e.key === "Enter" || e.code === "Space") {
        e.preventDefault();
        onDone();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result, onDone]);

  return (
    <Card className="w-full max-w-2xl animate-card-in">
      <CardHeader>
        <CardTitle>Speaking</CardTitle>
        <CardDescription>{speaking.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-xl font-medium">{speaking.targetText}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playCardAudio(speaking.targetText, speaking.audioUrl, languageCode)}
          >
            Play audio
          </Button>
        </div>

        {transcript !== null && (
          <p className="text-sm text-muted-foreground">
            We heard: <span className="italic">“{transcript}”</span>
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result ? (
          <div className="flex flex-col gap-3">
            <p className={`text-sm font-semibold ${result.correct ? "text-success" : "text-destructive"}`}>
              {result.correct ? "¡Perfecto! That matches." : "Close — compare with the target sentence above."}
            </p>
            <Button onClick={onDone} disabled={pending}>
              Finish lesson
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              disabled={listening || submitting}
              onClick={handleMic}
            >
              {listening ? "Listening… speak now" : "Record answer"}
            </Button>

            {isSpeechRecognitionSupported() && (
              <p className="text-center text-xs text-muted-foreground">
                Or type it instead:
              </p>
            )}
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/25"
                placeholder="Type the sentence…"
                value={typed}
                disabled={listening || submitting}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit(typed);
                }}
              />
              <Button
                variant="outline"
                disabled={!typed.trim() || listening || submitting}
                onClick={() => submit(typed)}
              >
                Check
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <ShortcutLegend
        items={[
          { keys: "Enter", label: result ? "finish" : "submit" },
        ]}
        className="pb-5"
      />
    </Card>
  );
}

function ReadingStep({
  lessonId,
  reading,
  pending,
  onDone,
}: {
  lessonId: string;
  reading: SessionReading;
  pending: boolean;
  onDone: () => void;
}) {
  const mcq = useMcq(reading.questions.length);

  function handleSubmit() {
    if (!mcq.allAnswered || mcq.submitting || mcq.result) return;
    mcq.setError(null);
    mcq.startSubmit(async () => {
      const scored = await scoreReadingAction(lessonId, reading.id, mcq.selections);
      if (scored.ok) {
        mcq.setResult(scored);
      } else {
        mcq.setError(scored.error);
      }
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.("button, a, input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      if (mcq.result) {
        if (e.key === "Enter" || e.code === "Space") {
          e.preventDefault();
          onDone();
        }
        return;
      }
      if (mcq.submitting) return;
      if (e.key === "Enter") {
        if (mcq.allAnswered) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }
      const optionCount = reading.questions[0]?.options.length ?? 0;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= optionCount) {
        e.preventDefault();
        const qIndex = mcq.selections.findIndex((s) => s < 0);
        if (qIndex >= 0 && qIndex < mcq.selections.length) {
          mcq.select(qIndex, n - 1);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcq.selections, mcq.result, mcq.submitting, mcq.allAnswered, reading, onDone]);

  return (
    <Card className="w-full max-w-2xl animate-card-in">
      <CardHeader>
        <CardTitle>Reading</CardTitle>
        <CardDescription>{reading.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="rounded-lg border border-border bg-muted/30 p-4 text-base leading-relaxed">
          {reading.passage}
        </p>

        <McqQuestions
          questions={reading.questions}
          selections={mcq.selections}
          result={mcq.result}
          onSelect={mcq.select}
        />

        {mcq.error && <p className="text-sm text-destructive">{mcq.error}</p>}

        {mcq.result ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              You got{" "}
              <span
                className={
                  mcq.result.correct === mcq.result.total
                    ? "font-semibold text-success"
                    : "font-semibold text-primary"
                }
              >
                {mcq.result.correct} of {mcq.result.total}
              </span>{" "}
              correct.
            </p>
            <Button onClick={onDone} disabled={pending}>
              Continue
            </Button>
          </div>
        ) : (
          <Button onClick={handleSubmit} disabled={!mcq.allAnswered || mcq.submitting}>
            Check answers
          </Button>
        )}
      </CardContent>
      <ShortcutLegend
        items={[
          { keys: "1–4", label: "select option" },
          { keys: "Enter", label: mcq.result ? "continue" : "check" },
        ]}
        className="pb-5"
      />
    </Card>
  );
}

function ListeningStep({
  lessonId,
  listening,
  pending,
  onDone,
}: {
  lessonId: string;
  listening: SessionListening;
  pending: boolean;
  onDone: () => void;
}) {
  const mcq = useMcq(listening.questions.length);
  const [audioError, setAudioError] = useState(false);

  function handleSubmit() {
    if (!mcq.allAnswered || mcq.submitting || mcq.result) return;
    mcq.setError(null);
    mcq.startSubmit(async () => {
      const scored = await scoreListeningAction(lessonId, listening.id, mcq.selections);
      if (scored.ok) {
        mcq.setResult(scored);
      } else {
        mcq.setError(scored.error);
      }
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.("button, a, input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      if (mcq.result) {
        if (e.key === "Enter" || e.code === "Space") {
          e.preventDefault();
          onDone();
        }
        return;
      }
      if (mcq.submitting) return;
      if (e.key === "Enter") {
        if (mcq.allAnswered) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }
      const optionCount = listening.questions[0]?.options.length ?? 0;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= optionCount) {
        e.preventDefault();
        const qIndex = mcq.selections.findIndex((s) => s < 0);
        if (qIndex >= 0 && qIndex < mcq.selections.length) {
          mcq.select(qIndex, n - 1);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcq.selections, mcq.result, mcq.submitting, mcq.allAnswered, listening, onDone]);

  return (
    <Card className="w-full max-w-2xl animate-card-in">
      <CardHeader>
        <CardTitle>Listening</CardTitle>
        <CardDescription>{listening.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4">
          {audioError ? (
            <p className="text-sm text-muted-foreground">
              Audio unavailable — please continue to the questions below.
            </p>
          ) : (
            <audio
              controls
              preload="none"
              src={listening.audioUrl}
              className="w-full"
              onError={() => setAudioError(true)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Listen as many times as you need, then answer below.
          </p>
        </div>

        <McqQuestions
          questions={listening.questions}
          selections={mcq.selections}
          result={mcq.result}
          onSelect={mcq.select}
        />

        {mcq.error && <p className="text-sm text-destructive">{mcq.error}</p>}

        {mcq.result ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              You got{" "}
              <span
                className={
                  mcq.result.correct === mcq.result.total
                    ? "font-semibold text-success"
                    : "font-semibold text-primary"
                }
              >
                {mcq.result.correct} of {mcq.result.total}
              </span>{" "}
              correct.
            </p>
            <Button onClick={onDone} disabled={pending}>
              Finish lesson
            </Button>
          </div>
        ) : (
          <Button onClick={handleSubmit} disabled={!mcq.allAnswered || mcq.submitting}>
            Check answers
          </Button>
        )}
      </CardContent>
      <ShortcutLegend
        items={[
          { keys: "1–4", label: "select option" },
          { keys: "Enter", label: mcq.result ? "finish" : "check" },
        ]}
        className="pb-5"
      />
    </Card>
  );
}
