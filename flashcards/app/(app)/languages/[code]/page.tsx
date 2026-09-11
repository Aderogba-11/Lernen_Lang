import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getUserEnrollments } from "@/lib/enrollments";
import { LEVEL_ORDER } from "./levels";
import { LevelPicker, type LevelStatus, type LevelOption } from "./level-picker";
import { LanguageFlag } from "@/components/language-flag";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Choose a level — Lernen Lang" };

export default async function LanguageLevelPage({
  params,
}: PageProps<"/languages/[code]">) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const { code } = await params;

  const language = await db.language.findUnique({ where: { code } });
  if (!language || !language.isActive) {
    notFound();
  }

  const publishedCourses = await db.course.findMany({
    where: { languageId: language.id, status: "PUBLISHED" },
    include: { level: true },
  });
  const availableCodes = new Set(publishedCourses.map((c) => c.level.code));

  const enrollments = await getUserEnrollments(user.id);
  const enrollment = enrollments.find((e) => e.language.code === language.code);
  const activeLevelCode =
    enrollment?.isActive && enrollment.course
      ? enrollment.course.level.code
      : null;

  const levels: LevelOption[] = LEVEL_ORDER.map((level) => {
    const status: LevelStatus = enrollment
      ? activeLevelCode === level.code
        ? "active"
        : "switch"
      : "new";
    return {
      code: level.code,
      name: level.name,
      available: availableCodes.has(level.code),
      status,
    };
  });

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-md flex-col gap-2">
        <div className="flex items-center gap-3">
          <LanguageFlag code={language.code} className="h-12 w-12 text-base" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {language.name}
            </h1>
            <span className="text-sm text-muted-foreground">
              {language.nativeName}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick your starting level. You can only select levels with a published
          course.
        </p>
      </div>
      <LevelPicker
        languageCode={language.code}
        languageName={language.name}
        levels={levels}
      />
      <Button asChild variant="ghost" size="sm">
        <Link href="/languages">← All languages</Link>
      </Button>
    </main>
  );
}
