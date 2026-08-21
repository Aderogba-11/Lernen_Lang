"use server";

import { requireUser } from "@/lib/session";
import {
  completeLesson,
  rateFlashcard,
  scoreLessonListening,
  scoreLessonReading,
  scoreLessonSpeaking,
  scoreLessonWriting,
  type Rating,
} from "@/lib/sessions";

export async function rateFlashcardAction(flashcardId: string, rating: Rating) {
  const user = await requireUser();
  return rateFlashcard(user.id, flashcardId, rating);
}

export async function scoreReadingAction(
  lessonId: string,
  exerciseId: string,
  selections: number[],
) {
  const user = await requireUser();
  return scoreLessonReading(user.id, lessonId, exerciseId, selections);
}

export async function scoreListeningAction(
  lessonId: string,
  exerciseId: string,
  selections: number[],
) {
  const user = await requireUser();
  return scoreLessonListening(user.id, lessonId, exerciseId, selections);
}

export async function scoreWritingAction(
  lessonId: string,
  exerciseId: string,
  response: string,
) {
  const user = await requireUser();
  return scoreLessonWriting(user.id, lessonId, exerciseId, response);
}

export async function scoreSpeakingAction(
  lessonId: string,
  exerciseId: string,
  transcript: string,
) {
  const user = await requireUser();
  return scoreLessonSpeaking(user.id, lessonId, exerciseId, transcript);
}

export async function completeLessonAction(lessonId: string) {
  const user = await requireUser();
  return completeLesson(user.id, lessonId);
}
