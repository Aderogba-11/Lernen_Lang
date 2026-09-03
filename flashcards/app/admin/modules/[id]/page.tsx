import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderIcon } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { AdminField } from "@/components/admin/admin-form";
import { AdminForm } from "@/components/admin/admin-form";
import {
  createModule,
  deleteModule,
  updateModule,
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

export const metadata = { title: "Module — Admin" };

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { courseId?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const module_ = isNew
    ? null
    : await db.module.findUnique({
        where: { id: params.id },
        include: {
          course: { include: { level: true } },
          lessons: {
            orderBy: { order: "asc" },
            include: { _count: { select: { flashcards: true, exercises: true } } },
          },
        },
      });
  if (!isNew && !module_) redirect("/admin");

  const course = isNew
    ? await db.course.findUnique({
        where: { id: searchParams.courseId },
        include: { language: true, level: true },
      })
    : module_!.course;

  const fields: AdminField[] = [
    {
      name: "title",
      label: "Title",
      value: module_?.title,
      placeholder: "e.g. Foundations",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      value: module_?.description,
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      value: module_?.order,
      required: true,
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "New module" : module_!.title}
          </h1>
          <p className="text-sm text-zinc-500">
            {course ? `${course.title} · ${course.level.code}` : "Module"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={course ? `/admin/courses/${course.id}` : "/admin"}>
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
                  ? createModule({ ...d, courseId: searchParams.courseId })
                  : updateModule(params.id, d)
              }
              successRedirect={isNew ? "/admin" : undefined}
              deleteAction={isNew ? undefined : deleteModule}
              deleteId={isNew ? undefined : params.id}
              deleteRedirect={course ? `/admin/courses/${course.id}` : "/admin"}
            />
          </CardContent>
        </Card>

        {module_ && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lessons</CardTitle>
                <Button asChild size="sm">
                  <Link href={`/admin/lessons/new?moduleId=${module_.id}`}>
                    New lesson
                  </Link>
                </Button>
              </div>
              <CardDescription>
                {module_.lessons.length} lesson
                {module_.lessons.length === 1 ? "" : "s"} — each lesson can hold
                flashcards and exercises.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {module_.lessons.length === 0 ? (
                <p className="text-sm text-zinc-500">No lessons yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {module_.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/admin/lessons/${lesson.id}`}
                        className="flex items-center justify-between rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <FolderIcon className="h-4 w-4 text-zinc-400" />
                          <span className="text-zinc-300 dark:text-zinc-600">
                            {lesson.order}.
                          </span>
                          {lesson.title}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-zinc-400">
                          <Badge variant="secondary">{lesson.status}</Badge>
                          {lesson._count.flashcards + lesson._count.exercises} items
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}