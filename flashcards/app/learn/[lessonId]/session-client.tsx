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
  scoreListeningAction,
  scoreReadingAction,
  scoreSpeakingAction,
  scoreWritingAction,
} from "./actions";
import { RATINGS, type Rating } from "@/lib/ratings";
import type {
  LessonSession,
  SessionListening,
  SessionReading,
  SessionSpeaking,
  SessionWriting,
} from "@/lib/sessions";
import { isSpeechRecognitionSupported, listenForSpeech } from "@/lib/speech";
import type { ReadingScore } from "@/lib/scoring";

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
              <span className={result.results[qIndex] ? " text-green-600" : " text-red-600"}>
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
                  className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors ${
                    isSelected
                      ? "border-zinc-900 dark:border-zinc-100"
                      : "border-zinc-200 dark:border-zinc-800"
                  } ${isCorrect ? "border-green-600 text-green-700 dark:text-green-400" : ""}`}
                >
                  <input
                    type="radio"
                    name={`q-${qIndex}`}
                    className="accent-zinc-900"
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
                setPhase("cards");
                setWritingIndex(0);
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

  if (phase === "writing" && session.writings[writingIndex]) {
    return (
      <WritingStep
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
        onDone={handleSpeakingDone}
      />
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardDescription>
          Writing {stepNumber} / {stepTotal}
        </CardDescription>
        <CardTitle>{writing.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="rounded-lg border border-zinc-200 p-4 text-base dark:border-zinc-800">
          {writing.display}
        </p>

        <textarea
          className="min-h-20 w-full rounded-md border border-zinc-300 bg-transparent p-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result ? (
          <div className="flex flex-col gap-3">
            <p className={`text-sm font-medium ${result.correct ? "text-green-600" : "text-red-600"}`}>
              {result.correct ? "Correct!" : "Not quite."}
            </p>
            {!result.correct && (
              <p className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                Expected answer: <span className="font-medium">{result.expected}</span>
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
    </Card>
  );
}

function SpeakingStep({
  lessonId,
  speaking,
  pending,
  onDone,
}: {
  lessonId: string;
  speaking: SessionSpeaking;
  pending: boolean;
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Speaking</CardTitle>
        <CardDescription>{speaking.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
          <p className="text-xl font-medium">{speaking.targetText}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playCardAudio(speaking.targetText, speaking.audioUrl)}
          >
            Play audio
          </Button>
        </div>

        {transcript !== null && (
          <p className="text-sm text-zinc-500">
            We heard: <span className="italic">“{transcript}”</span>
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result ? (
          <div className="flex flex-col gap-3">
            <p className={`text-sm font-medium ${result.correct ? "text-green-600" : "text-red-600"}`}>
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
              <p className="text-center text-xs text-zinc-400">
                Or type it instead:
              </p>
            )}
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Reading</CardTitle>
        <CardDescription>{reading.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="rounded-lg border border-zinc-200 p-4 text-base leading-relaxed dark:border-zinc-800">
          {reading.passage}
        </p>

        <McqQuestions
          questions={reading.questions}
          selections={mcq.selections}
          result={mcq.result}
          onSelect={mcq.select}
        />

        {mcq.error && <p className="text-sm text-red-600">{mcq.error}</p>}

        {mcq.result ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              You got {mcq.result.correct} of {mcq.result.total} correct.
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Listening</CardTitle>
        <CardDescription>{listening.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <audio controls preload="none" src={listening.audioUrl} className="w-full" />
          <p className="text-xs text-zinc-400">
            Listen as many times as you need, then answer below.
          </p>
        </div>

        <McqQuestions
          questions={listening.questions}
          selections={mcq.selections}
          result={mcq.result}
          onSelect={mcq.select}
        />

        {mcq.error && <p className="text-sm text-red-600">{mcq.error}</p>}

        {mcq.result ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              You got {mcq.result.correct} of {mcq.result.total} correct.
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
    </Card>
  );
}
