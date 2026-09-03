import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  ExerciseForm,
  type ExerciseFormValue,
} from "@/components/admin/exercise-form";
import {
  createExercise,
  deleteExercise,
  updateExercise,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Exercise — Admin" };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export default async function ExercisePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lessonId?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const exercise = isNew
    ? null
    : await db.exercise.findUnique({
        where: { id: params.id },
        include: { lesson: { include: { module: { include: { course: true } } } } },
      });
  if (!isNew && !exercise) redirect("/admin");

  const lesson = isNew
    ? await db.lesson.findUnique({
        where: { id: searchParams.lessonId },
        include: { module: { include: { course: true } } },
      })
    : exercise!.lesson;

  let value: ExerciseFormValue | null = null;
  if (exercise) {
    value = {
      id: exercise.id,
      prompt: exercise.prompt,
      type: exercise.type,
      order: exercise.order,
      status: exercise.status,
      content: asRecord(exercise.content),
      answer: asRecord(exercise.answer),
    };
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "New exercise" : exercise!.prompt}
          </h1>
          <p className="text-sm text-zinc-500">
            {lesson ? `Lesson: ${lesson.title}` : "Exercise"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={lesson ? `/admin/lessons/${lesson.id}` : "/admin"}>
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Fill in the fields for this exercise type. Questions are edited as
              one prompt per option line.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExerciseForm
              exercise={value}
              create={(d) => createExercise({ ...d, lessonId: searchParams.lessonId })}
              update={updateExercise}
              remove={deleteExercise}
              successRedirect={isNew ? "/admin" : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}