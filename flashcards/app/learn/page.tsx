import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getActiveEnrollment } from "@/lib/enrollments";
import { getPublishedCourse } from "@/lib/catalog";
import { getCompletedLessonIds } from "@/lib/sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Learn — Lernen Lang" };

export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const enrollment = await getActiveEnrollment(user.id);
  if (!enrollment) {
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

  const course =
    enrollment.course && enrollment.course.status === "PUBLISHED"
      ? await getPublishedCourse(enrollment.language.code, enrollment.course.level.code)
      : null;

  if (!course) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Course unavailable</CardTitle>
            <CardDescription>
              Your active course is not available right now. Pick another
              language or level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/languages">Browse languages</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const allLessons = course.modules.flatMap((module_) => module_.lessons);
  const completedIds = new Set(await getCompletedLessonIds(user.id, allLessons.map((l) => l.id)));

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <Badge>{course.level.code}</Badge>
        </div>
        <p className="text-sm text-zinc-500">
          {course.language.name} · {course.language.nativeName} ·{" "}
          {course.description}
        </p>
        <p className="text-sm text-zinc-500">
          {completedIds.size} of {allLessons.length} lessons completed
        </p>
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        {course.modules.map((module_) => (
          <Card key={module_.id}>
            <CardHeader>
              <CardTitle>
                Module {module_.order}: {module_.title}
              </CardTitle>
              {module_.description && (
                <CardDescription>{module_.description}</CardDescription>
              )}
            </CardHeader>
            {module_.lessons.length > 0 && (
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {module_.lessons.map((lesson) => {
                    const isCompleted = completedIds.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/${lesson.id}`}
                          className="flex flex-col rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            Lesson {lesson.order}: {lesson.title}
                            {isCompleted && <Badge>✓</Badge>}
                          </span>
                          {lesson.objective && (
                            <span className="text-sm text-zinc-500">
                              {lesson.objective}
                            </span>
                          )}
                          <span className="mt-1 text-xs text-zinc-400">
                            {isCompleted ? "Completed — practice again" : "Start lesson"}
                          </span>
                        </Link>
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
