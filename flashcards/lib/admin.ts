import { getSessionUser } from "@/lib/session";

export function isAdmin(user: { role?: string | null } | null): boolean {
  return user?.role === "ADMIN";
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}