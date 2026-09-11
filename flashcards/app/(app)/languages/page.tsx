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
import { LanguageFlag } from "@/components/language-flag";
import { ArrowRightIcon } from "lucide-react";
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
    <main className="flex flex-1 flex-col items-center gap-10 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Languages</h1>
      </div>

      <div className="w-full max-w-2xl">
        <EnrollmentList enrollments={enrollmentViews} />
      </div>

      <section className="flex w-full max-w-2xl flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Start a language
        </h2>
        {languages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No languages available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {languages.map((language) => (
              <Link
                key={language.id}
                href={`/languages/${language.code}`}
                className="group"
              >
                <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <LanguageFlag code={language.code} />
                      <div className="flex flex-col">
                        <CardTitle>{language.name}</CardTitle>
                        <CardDescription>
                          {language.nativeName}
                        </CardDescription>
                      </div>
                    </div>
                    <CardAction>
                      <Badge variant="outline">{language.code}</Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="flex items-center gap-1.5 text-sm text-primary">
                      Choose a level
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}