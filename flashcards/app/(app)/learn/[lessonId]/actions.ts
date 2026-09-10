"use server";

import { requireUser } from "@/lib/session";
import {
  completeLesson,
  rateFlashcard,
  scoreLessonListening,
  scoreLessonReading,
  scoreLessonSpeaking,
  scoreLessonWriting,
} from "@/lib/sessions";
import {
  rateFlashcardSchema,
  scoreReadingSchema,
  scoreListeningSchema,
  scoreWritingSchema,
  scoreSpeakingSchema,
  completeLessonSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/enrollments";
import type { ReadingScore } from "@/lib/scoring";

export type ScoredResult =
  | { ok: true; correct: boolean; expected: string }
  | { ok: false; error: string };

export async function rateFlashcardAction(
  flashcardId: string,
  rating: string,
): Promise<ActionResult> {
  const parsed = rateFlashcardSchema.safeParse({ flashcardId, rating });
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  try {
    const user = await requireUser();
    return rateFlashcard(user.id, parsed.data.flashcardId, parsed.data.rating);
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function scoreReadingAction(
  lessonId: string,
  exerciseId: string,
  selections: number[],
): Promise<(ReadingScore & { ok: true }) | { ok: false; error: string }> {
  const parsed = scoreReadingSchema.safeParse({ lessonId, exerciseId, selections });
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  try {
    const user = await requireUser();
    return scoreLessonReading(
      user.id,
      parsed.data.lessonId,
      parsed.data.exerciseId,
      parsed.data.selections,
    );
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function scoreListeningAction(
  lessonId: string,
  exerciseId: string,
  selections: number[],
): Promise<(ReadingScore & { ok: true }) | { ok: false; error: string }> {
  const parsed = scoreListeningSchema.safeParse({ lessonId, exerciseId, selections });
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  try {
    const user = await requireUser();
    return scoreLessonListening(
      user.id,
      parsed.data.lessonId,
      parsed.data.exerciseId,
      parsed.data.selections,
    );
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function scoreWritingAction(
  lessonId: string,
  exerciseId: string,
  response: string,
): Promise<ScoredResult> {
  const parsed = scoreWritingSchema.safeParse({ lessonId, exerciseId, response });
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  try {
    const user = await requireUser();
    return scoreLessonWriting(
      user.id,
      parsed.data.lessonId,
      parsed.data.exerciseId,
      parsed.data.response,
    );
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function scoreSpeakingAction(
  lessonId: string,
  exerciseId: string,
  transcript: string,
): Promise<ScoredResult> {
  const parsed = scoreSpeakingSchema.safeParse({ lessonId, exerciseId, transcript });
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  try {
    const user = await requireUser();
    return scoreLessonSpeaking(
      user.id,
      parsed.data.lessonId,
      parsed.data.exerciseId,
      parsed.data.transcript,
    );
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}

export async function completeLessonAction(lessonId: string): Promise<ActionResult> {
  const parsed = completeLessonSchema.safeParse({ lessonId });
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  try {
    const user = await requireUser();
    return completeLesson(user.id, parsed.data.lessonId);
  } catch {
    return { ok: false, error: "Not signed in." };
  }
}
