"use server";

import { getSessionUser } from "@/lib/session";
import { rateFlashcard } from "@/lib/sessions";
import type { Rating } from "@/lib/ratings";

export async function rateReviewCard(
  flashcardId: string,
  rating: Rating,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  return rateFlashcard(user.id, flashcardId, rating);
}
