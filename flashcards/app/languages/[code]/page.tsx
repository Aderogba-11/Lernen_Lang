import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { LEVEL_ORDER } from "./levels";
import { LevelPicker, type LevelOption } from "./level-picker";
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

  const levels: LevelOption[] = LEVEL_ORDER.map((level) => ({
    code: level.code,
    name: level.name,
    available: availableCodes.has(level.code),
  }));

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {language.name}{" "}
          <span className="text-lg font-normal text-zinc-500">
            {language.nativeName}
          </span>
        </h1>
        <p className="text-sm text-zinc-500">
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
