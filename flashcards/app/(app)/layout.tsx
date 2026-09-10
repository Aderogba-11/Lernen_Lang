import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { NotificationBell } from "@/components/notification-bell";
import { NavLinks } from "@/components/nav/nav-links";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-black/95">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-semibold tracking-tight"
          >
            Lernen Lang
          </Link>
          <NavLinks />
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell user={user} />
            <Link
              href="/account"
              aria-label="Account"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-black"
            >
              {user.name?.trim().charAt(0).toUpperCase() || "?"}
            </Link>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}