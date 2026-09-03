import Link from "next/link";
import { redirect } from "next/navigation";
import { BookIcon, FolderIcon, LayersIcon, LanguagesIcon } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getAdminCatalogTree } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Admin — Lernen Lang" };

const STATUS_STYLE: Record<string, "default" | "secondary"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
};

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  const tree = await getAdminCatalogTree();

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content management</h1>
          <p className="text-sm text-zinc-500">
            Maintain the learning catalogue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <section className="flex w-full max-w-4xl flex-col gap-4">
        {tree.map((language) => (
          <Card key={language.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LanguagesIcon className="h-5 w-5 text-zinc-400" />
                  <CardTitle>{language.name}</CardTitle>
                  <Badge variant="outline">{language.code}</Badge>
                  {!language.isActive && (
                    <Badge variant="secondary">inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/languages/${language.id}`}>Manage</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/admin/courses/new?languageId=${language.id}`}>
                      New course
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            {language.courses.length > 0 && (
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {language.courses.map((course) => (
                    <li key={course.id}>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="flex items-center justify-between rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <BookIcon className="h-4 w-4 text-zinc-400" />
                          {course.title}
                          <Badge variant="outline">{course.level.code}</Badge>
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant={STATUS_STYLE[course.status] ?? "secondary"}>
                            {course.status}
                          </Badge>
                          <span className="text-xs text-zinc-400">
                            {course.modules.length} module
                            {course.modules.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </Link>
                      {course.modules.length > 0 && (
                        <ul className="mt-1 flex flex-col gap-1 pl-6">
                          {course.modules.map((module_) => (
                            <li key={module_.id}>
                              <Link
                                href={`/admin/modules/${module_.id}`}
                                className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 text-sm transition-colors hover:border-zinc-300 dark:border-zinc-900 dark:hover:border-zinc-700"
                              >
                                <span className="flex items-center gap-2">
                                  <FolderIcon className="h-4 w-4 text-zinc-400" />
                                  <span className="text-zinc-300 dark:text-zinc-600">
                                    {module_.order}.
                                  </span>
                                  {module_.title}
                                </span>
                                <span className="text-xs text-zinc-400">
                                  {module_.lessons.length} lesson
                                  {module_.lessons.length === 1 ? "" : "s"}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}

        {tree.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No languages yet</CardTitle>
              <CardDescription>
                Create your first language to start building content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/languages/new">New language</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex w-full max-w-4xl gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/languages/new">
            <LanguagesIcon className="mr-2 h-4 w-4" /> New language
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/levels/new">
            <LayersIcon className="mr-2 h-4 w-4" /> New level
          </Link>
        </Button>
      </section>
    </main>
  );
}