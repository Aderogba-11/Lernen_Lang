"use server";

import { requireUser } from "@/lib/session";
import {
  completeLesson,
  rateFlashcard,
  type Rating,
} from "@/lib/sessions";

export async function rateFlashcardAction(flashcardId: string, rating: Rating) {
  const user = await requireUser();
  return rateFlashcard(user.id, flashcardId, rating);
}

export async function completeLessonAction(lessonId: string) {
  const user = await requireUser();
  return completeLesson(user.id, lessonId);
}
