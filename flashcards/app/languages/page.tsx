import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getActiveLanguages } from "@/lib/catalog";
import { getUserEnrollments } from "@/lib/enrollments";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrollmentList, type EnrollmentView } from "./enrollment-list";

export const metadata = { title: "Languages — Lernen Lang" };

export default async function LanguagesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [enrollments, languages] = await Promise.all([
    getUserEnrollments(user.id),
    getActiveLanguages(),
  ]);

  const enrollmentViews: EnrollmentView[] = enrollments.map((e) => ({
    id: e.id,
    isActive: e.isActive,
    languageName: e.language.name,
    languageCode: e.language.code,
    nativeName: e.language.nativeName,
    courseTitle: e.course?.title ?? null,
    levelCode: e.course?.level.code ?? null,
  }));

  return (
    <main className="flex flex-1 flex-col items-center gap-10 bg-zinc-50 p-6 dark:bg-black">
      <div className="w-full max-w-2xl">
        <EnrollmentList enrollments={enrollmentViews} />
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Start a language</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {languages.map((language) => (
            <Link key={language.id} href={`/languages/${language.code}`}>
              <Card className="h-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <CardHeader>
                  <CardTitle>{language.name}</CardTitle>
                  <CardDescription>{language.nativeName}</CardDescription>
                  <CardAction>
                    <Badge variant="outline">{language.code}</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500">Choose a level →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
