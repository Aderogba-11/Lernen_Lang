"use server";

import { getSessionUser } from "@/lib/session";
import { markNotificationsRead } from "@/lib/notifications";

export async function markReadAction(
  ids: string[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "You are not signed in." };
  }
  await markNotificationsRead(user.id, ids);
  return { ok: true };
}

export async function markAllReadAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "You are not signed in." };
  }
  await markNotificationsRead(user.id);
  return { ok: true };
}