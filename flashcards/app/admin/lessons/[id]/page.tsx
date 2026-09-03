import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderIcon } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { AdminField } from "@/components/admin/admin-form";
import { AdminForm } from "@/components/admin/admin-form";
import {
  createLesson,
  deleteLesson,
  updateLesson,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Lesson — Admin" };

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { moduleId?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const lesson = isNew
    ? null
    : await db.lesson.findUnique({
        where: { id: params.id },
        include: {
          module: { include: { course: { include: { level: true } } } },
          flashcards: { orderBy: { order: "asc" } },
          exercises: { orderBy: { order: "asc" } },
        },
      });
  if (!isNew && !lesson) redirect("/admin");

  const module_ = isNew
    ? await db.module.findUnique({
        where: { id: searchParams.moduleId },
        include: { course: { include: { level: true } } },
      })
    : lesson!.module;

  const fields: AdminField[] = [
    {
      name: "title",
      label: "Title",
      value: lesson?.title,
      placeholder: "e.g. Greetings",
      required: true,
    },
    {
      name: "objective",
      label: "Objective",
      type: "textarea",
      value: lesson?.objective,
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      value: lesson?.notes,
    },
    {
      name: "audioUrl",
      label: "Lesson audio URL",
      value: lesson?.audioUrl,
      placeholder: "/audio/es/lesson-intro.mp3",
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      value: lesson?.order,
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      value: lesson?.status ?? "DRAFT",
      options: [
        { label: "Draft", value: "DRAFT" },
        { label: "Published", value: "PUBLISHED" },
      ],
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "New lesson" : lesson!.title}
          </h1>
          <p className="text-sm text-zinc-500">
            {module_
              ? `${module_.course.title} · ${module_.course.level.code} · ${module_.title}`
              : "Lesson"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={module_ ? `/admin/modules/${module_.id}` : "/admin"}>
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminForm
              fields={fields}
              action={(d) =>
                isNew
                  ? createLesson({ ...d, moduleId: searchParams.moduleId })
                  : updateLesson(params.id, d)
              }
              successRedirect={isNew ? "/admin" : undefined}
              deleteAction={isNew ? undefined : deleteLesson}
              deleteId={isNew ? undefined : params.id}
              deleteRedirect={module_ ? `/admin/modules/${module_.id}` : "/admin"}
            />
          </CardContent>
        </Card>

        {lesson && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Flashcards</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/admin/flashcards/new?lessonId=${lesson.id}`}>
                      New flashcard
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  {lesson.flashcards.length} card
                  {lesson.flashcards.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lesson.flashcards.length === 0 ? (
                  <p className="text-sm text-zinc-500">No flashcards yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {lesson.flashcards.map((card) => (
                      <li key={card.id}>
                        <Link
                          href={`/admin/flashcards/${card.id}`}
                          className="flex items-center justify-between rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-zinc-300 dark:text-zinc-600">
                              {card.order}.
                            </span>
                            {card.targetText}
                            <span className="text-sm font-normal text-zinc-400">
                              · {card.translation}
                            </span>
                          </span>
                          <Badge variant="secondary">{card.status}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Exercises</CardTitle>
                  <Button asChild size="sm">
                    <Link href={`/admin/exercises/new?lessonId=${lesson.id}`}>
                      New exercise
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  {lesson.exercises.length} exercise
                  {lesson.exercises.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lesson.exercises.length === 0 ? (
                  <p className="text-sm text-zinc-500">No exercises yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {lesson.exercises.map((exercise) => (
                      <li key={exercise.id}>
                        <Link
                          href={`/admin/exercises/${exercise.id}`}
                          className="flex items-center justify-between rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <FolderIcon className="h-4 w-4 text-zinc-400" />
                            <span className="text-zinc-300 dark:text-zinc-600">
                              {exercise.order}.
                            </span>
                            {exercise.prompt}
                          </span>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline">{exercise.type}</Badge>
                            <Badge variant="secondary">{exercise.status}</Badge>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}