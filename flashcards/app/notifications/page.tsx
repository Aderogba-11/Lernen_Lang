import Link from "next/link";
import {
  BadgeCheckIcon,
  ClockIcon,
  FlagIcon,
  FlameIcon,
  InboxIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkAllReadButton, MarkReadButton } from "./mark-read";

export const metadata = { title: "Notifications — Lernen Lang" };

const TYPE_UI: Record<
  string,
  { label: string; icon: typeof BadgeCheckIcon }
> = {
  ACHIEVEMENT: { label: "Achievement", icon: BadgeCheckIcon },
  COURSE_COMPLETE: { label: "Course complete", icon: FlagIcon },
  DAILY_REMINDER: { label: "Daily reminder", icon: ClockIcon },
  STREAK_AT_RISK: { label: "Streak at risk", icon: FlameIcon },
};

function formatWhen(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const items = await getNotifications(user.id);
  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-zinc-500">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MarkAllReadButton disabled={unreadCount === 0} />
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        {items.length === 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <InboxIcon className="h-5 w-5 text-zinc-400" />
                <div>
                  <CardTitle>Nothing here yet</CardTitle>
                  <CardDescription>
                    Milestones, reminders and streaks will show up here.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ) : (
          items.map((item) => {
            const ui = TYPE_UI[item.type] ?? {
              label: "Update",
              icon: BadgeCheckIcon,
            };
            const Icon = ui.icon;
            const text = (
              <>
                <span className="flex items-center gap-2 font-medium">
                  {item.title}
                  {item.unread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </span>
                {item.body && (
                  <span className="text-sm text-zinc-500">{item.body}</span>
                )}
                <span className="mt-1 text-xs text-zinc-400">
                  {ui.label} · {formatWhen(item.createdAt)}
                </span>
              </>
            );

            return (
              <Card key={item.id}>
                <CardContent className="flex items-start gap-3 pt-6">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md p-2 ${
                      item.unread
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {item.link ? (
                      <Link href={item.link} className="flex flex-col">
                        {text}
                      </Link>
                    ) : (
                      text
                    )}
                  </div>
                  {item.unread ? (
                    <MarkReadButton notificationId={item.id} />
                  ) : (
                    <BadgeCheckIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </main>
  );
}