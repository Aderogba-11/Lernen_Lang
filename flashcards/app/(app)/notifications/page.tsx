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
    <main className="flex flex-1 flex-col items-center gap-8 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up"}
          </p>
        </div>
        <MarkAllReadButton disabled={unreadCount === 0} />
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        {items.length === 0 ? (
          <Card className="animate-card-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <InboxIcon className="h-5 w-5" />
                </span>
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
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </span>
                {item.body && (
                  <span className="text-sm text-muted-foreground">
                    {item.body}
                  </span>
                )}
                <span className="mt-1 text-xs text-muted-foreground">
                  {ui.label} · {formatWhen(item.createdAt)}
                </span>
              </>
            );

            return (
              <Card key={item.id} className="animate-slide-in">
                <CardContent className="flex items-start gap-3 pt-6">
                  <span
                    className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                      item.unread
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
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
                    <BadgeCheckIcon className="mt-1 h-4 w-4 shrink-0 text-border" />
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