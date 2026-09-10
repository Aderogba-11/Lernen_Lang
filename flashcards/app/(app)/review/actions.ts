"use server";

import { getSessionUser } from "@/lib/session";
import { rateFlashcard } from "@/lib/sessions";
import { rateFlashcardSchema } from "@/lib/validation";

export async function rateReviewCard(
  flashcardId: string,
  rating: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = rateFlashcardSchema.safeParse({ flashcardId, rating });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  return rateFlashcard(user.id, parsed.data.flashcardId, parsed.data.rating);
}
