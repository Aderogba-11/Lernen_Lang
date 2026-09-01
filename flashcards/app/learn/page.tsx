import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourseNavigation, type LessonStatus } from "@/lib/course";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";

export const metadata = { title: "Learn — Lernen Lang" };

const STATUS_UI: Record<
  LessonStatus,
  { badge: string; sub: string; variant: "default" | "secondary" | "outline" }
> = {
  COMPLETED: { badge: "✓", sub: "Completed — practice again", variant: "default" },
  IN_PROGRESS: { badge: "In progress", sub: "Continue where you left off", variant: "outline" },
  AVAILABLE: { badge: "Start", sub: "Start lesson", variant: "secondary" },
  LOCKED: { badge: "Locked", sub: "Complete earlier lessons first", variant: "secondary" },
};

export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const nav = await getCourseNavigation(user.id);

  if (!nav.enrolled) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No active language</CardTitle>
            <CardDescription>
              Choose a language and level to start learning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/languages">Choose a language</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{nav.courseTitle}</h1>
            <Badge>{nav.levelCode}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/review">Review</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/progress">My progress</Link>
            </Button>
          </div>
        </div>
        <p className="text-sm text-zinc-500">
          {nav.languageName} · {nav.nativeName} ·{" "}
          {nav.description}
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {nav.lessonsCompleted} of {nav.lessonsTotal} lessons completed
          </p>
          {nav.nextLessonId && (
            <Button asChild size="sm">
              <Link href={`/learn/${nav.nextLessonId}`}>Continue</Link>
            </Button>
          )}
        </div>
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        {nav.modules.map((module_) => (
          <Card key={module_.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  Module {module_.order}: {module_.title}
                </CardTitle>
                <Badge variant="secondary">
                  {module_.completed}/{module_.total} lessons
                </Badge>
              </div>
              {module_.description && (
                <CardDescription>{module_.description}</CardDescription>
              )}
            </CardHeader>
            {module_.lessons.length > 0 && (
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {module_.lessons.map((lesson) => {
                    const ui = STATUS_UI[lesson.status];
                    const isLocked = lesson.status === "LOCKED";
                    const isNext = lesson.id === nav.nextLessonId;
                    return (
                      <li key={lesson.id}>
                        {isLocked ? (
                          <div
                            aria-disabled
                            className="flex flex-col rounded-md border border-dashed border-zinc-200 p-3 opacity-60 dark:border-zinc-800"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              Lesson {lesson.order}: {lesson.title}
                              <Badge variant="secondary">{ui.badge}</Badge>
                            </span>
                            {lesson.objective && (
                              <span className="text-sm text-zinc-500">
                                {lesson.objective}
                              </span>
                            )}
                            <span className="mt-1 text-xs text-zinc-400">
                              {ui.sub}
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/learn/${lesson.id}`}
                            className="flex flex-col rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              Lesson {lesson.order}: {lesson.title}
                              <Badge variant={ui.variant}>{ui.badge}</Badge>
                              {isNext && <Badge>Next up</Badge>}
                            </span>
                            {lesson.objective && (
                              <span className="text-sm text-zinc-500">
                                {lesson.objective}
                              </span>
                            )}
                            <span className="mt-1 text-xs text-zinc-400">
                              {ui.sub}
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </section>
    </main>
  );
}