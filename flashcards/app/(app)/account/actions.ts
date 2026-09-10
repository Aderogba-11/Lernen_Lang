"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { updateAccountSchema } from "@/lib/validation";

export type UpdateAccountResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateAccountName(
  input: unknown,
): Promise<UpdateAccountResult> {
  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Name must be 2–70 characters." };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "You are not signed in." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  return { ok: true };
}
