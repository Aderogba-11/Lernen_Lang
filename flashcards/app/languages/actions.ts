"use server";

import { getSessionUser } from "@/lib/session";
import {
  setActiveEnrollmentForUser,
  startLanguageForUser,
  type ActionResult,
} from "@/lib/enrollments";

export async function startLanguage(
  languageCode: string,
  levelCode: string,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "You are not signed in." };
  }
  return startLanguageForUser(user.id, languageCode, levelCode);
}

export async function setActiveEnrollment(
  enrollmentId: string,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "You are not signed in." };
  }
  return setActiveEnrollmentForUser(user.id, enrollmentId);
}
