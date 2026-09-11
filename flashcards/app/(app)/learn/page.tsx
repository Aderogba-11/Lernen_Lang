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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, LockIcon, PlayIcon } from "lucide-react";

export const metadata = { title: "Learn — Lernen Lang" };

const STATUS_UI: Record<
  LessonStatus,
  { badge: string; sub: string; variant: "default" | "secondary" | "outline"; color?: string }
> = {
  COMPLETED: { badge: "Completed", sub: "Practice again", variant: "default" },
  IN_PROGRESS: { badge: "In progress", sub: "Continue where you left off", variant: "outline", color: "text-primary" },
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
      <main className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
        <Card className="w-full max-w-md animate-card-in">
          <CardHeader>
            <CardTitle className="text-xl">No active language</CardTitle>
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

  const pct = Math.round((nav.lessonsCompleted / nav.lessonsTotal) * 100);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {nav.courseTitle}
            </h1>
            <Badge>{nav.levelCode}</Badge>
          </div>
          {nav.nextLessonId && (
            <Button asChild size="sm">
              <Link href={`/learn/${nav.nextLessonId}`}>
                <PlayIcon className="h-4 w-4" />
                Continue
              </Link>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {nav.languageName} · {nav.nativeName} · {nav.description}
        </p>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">
            {nav.lessonsCompleted}/{nav.lessonsTotal} lessons · {pct}%
          </span>
        </div>
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        {nav.modules.map((module_) => {
          const modulePct =
            module_.total === 0
              ? 0
              : Math.round((module_.completed / module_.total) * 100);
          return (
            <Card key={module_.id} className="animate-card-in">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>
                    Module {module_.order}: {module_.title}
                  </CardTitle>
                  <Badge variant="secondary">
                    {module_.completed}/{module_.total}
                  </Badge>
                </div>
                {module_.description && (
                  <CardDescription>{module_.description}</CardDescription>
                )}
              </CardHeader>
              {module_.lessons.length > 0 && (
                <CardContent className="flex flex-col gap-3">
                  <Progress value={modulePct} className="h-1.5" />
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
                              className="flex flex-col gap-1 rounded-lg border border-dashed border-border p-3 opacity-60"
                            >
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                Lesson {lesson.order}: {lesson.title}
                                <Badge variant="secondary">
                                  {ui.badge}
                                </Badge>
                              </span>
                              {lesson.objective && (
                                <span className="text-sm text-muted-foreground">
                                  {lesson.objective}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {ui.sub}
                              </span>
                            </div>
                          ) : (
                            <Link
                              href={`/learn/${lesson.id}`}
                              className={`flex flex-col gap-1 rounded-lg border p-3 transition-all ${
                                isNext
                                  ? "border-primary/40 bg-primary/5 hover:shadow-md hover:shadow-primary/5"
                                  : lesson.status === "COMPLETED"
                                    ? "border-success/40 hover:shadow-md"
                                    : "border-border hover:border-primary/40 hover:shadow-sm"
                              }`}
                            >
                              <span className="flex items-center gap-2 text-sm font-medium">
                                {lesson.status === "COMPLETED" && (
                                  <CheckCircle2Icon className="h-4 w-4 text-success" />
                                )}
                                Lesson {lesson.order}: {lesson.title}
                                {isNext && (
                                  <Badge className="bg-primary text-primary-foreground">
                                    Next up
                                  </Badge>
                                )}
                              </span>
                              {lesson.objective && (
                                <span className="text-sm text-muted-foreground">
                                  {lesson.objective}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
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
          );
        })}
      </section>
    </main>
  );
}