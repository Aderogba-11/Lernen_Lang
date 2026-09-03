import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderIcon } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { AdminField } from "@/components/admin/admin-form";
import { AdminForm } from "@/components/admin/admin-form";
import {
  createCourse,
  deleteCourse,
  updateCourse,
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

export const metadata = { title: "Course — Admin" };

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { languageId?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const [course, languages, levels] = isNew
    ? [null, await db.language.findMany({ orderBy: { name: "asc" } }), await db.level.findMany({ orderBy: { order: "asc" } })]
    : [
        await db.course.findUnique({
          where: { id: params.id },
          include: {
            language: true,
            level: true,
            modules: {
              orderBy: { order: "asc" },
              include: { _count: { select: { lessons: true } } },
            },
          },
        }),
        await db.language.findMany({ orderBy: { name: "asc" } }),
        await db.level.findMany({ orderBy: { order: "asc" } }),
      ];
  if (!isNew && !course) redirect("/admin");

  const fields: AdminField[] = [
    {
      name: "title",
      label: "Title",
      value: course?.title,
      placeholder: "e.g. Spanish A1",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      value: course?.description,
    },
    {
      name: "languageId",
      label: "Language",
      type: "select",
      value: course?.languageId ?? searchParams.languageId,
      required: true,
      options: languages.map((l) => ({ label: l.name, value: l.id })),
    },
    {
      name: "levelId",
      label: "Level",
      type: "select",
      value: course?.levelId,
      required: true,
      options: levels.map((l) => ({ label: l.code, value: l.id })),
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      value: course?.status ?? "DRAFT",
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
            {isNew ? "New course" : course!.title}
          </h1>
          <p className="text-sm text-zinc-500">
            {isNew && searchParams.languageId ? "New course" : "Course details"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">Back</Link>
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
                isNew ? createCourse(d) : updateCourse(params.id, d)
              }
              successRedirect={isNew ? "/admin" : undefined}
              deleteAction={isNew ? undefined : deleteCourse}
              deleteId={isNew ? undefined : params.id}
              deleteRedirect="/admin"
            />
          </CardContent>
        </Card>

        {course && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Modules</CardTitle>
                <Button asChild size="sm">
                  <Link href={`/admin/modules/new?courseId=${course.id}`}>
                    New module
                  </Link>
                </Button>
              </div>
              <CardDescription>
                {course.modules.length} module{course.modules.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.modules.length === 0 ? (
                <p className="text-sm text-zinc-500">No modules yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {course.modules.map((module_) => (
                    <li key={module_.id}>
                      <Link
                        href={`/admin/modules/${module_.id}`}
                        className="flex items-center justify-between rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <FolderIcon className="h-4 w-4 text-zinc-400" />
                          <span className="text-zinc-300 dark:text-zinc-600">
                            {module_.order}.
                          </span>
                          {module_.title}
                        </span>
                        <Badge variant="secondary">
                          {module_._count?.lessons ?? ""}
                        </Badge>
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