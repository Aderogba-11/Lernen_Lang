import "dotenv/config";
import { db } from "../lib/db";
import { getActiveLanguages, getPublishedCourse } from "../lib/catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function main() {
  const languages = await getActiveLanguages();
  assert(languages.length === 6, `expected 6 active languages, got ${languages.length}`);
  assert(
    languages.map((l) => l.code).sort().join(",") === "de,es,fr,pt,ru,zh",
    "language codes mismatch",
  );

  const levels = await db.level.findMany({ orderBy: { order: "asc" } });
  assert(
    levels.map((l) => l.code).join(",") === "A1,A2,B1,B2,C1,C2",
    `level order wrong: ${levels.map((l) => l.code).join(",")}`,
  );

  const course = await getPublishedCourse("es", "A1");
  assert(course, "Spanish A1 course not found");
  assert(course!.status === "PUBLISHED", "course not published");
  assert(course!.modules.length === 6, `expected 6 modules, got ${course!.modules.length}`);
  assert(
    course!.modules.map((m) => m.title).join(" | ") ===
      "Foundations | Numbers and Time | People | Everyday Life | Out and About | Free Time",
    "module titles/order mismatch",
  );

  const foundations = course!.modules[0];
  assert(foundations.lessons.length === 3, "expected 3 lessons in Foundations");
  assert(
    foundations.lessons.every(
      (l) =>
        l.exercises.some((e) => e.type === "WRITING") &&
        l.exercises.every((e) => ["WRITING", "READING", "LISTENING", "SPEAKING"].includes(e.type)),
    ),
    "each lesson should have WRITING exercises (plus optional READING/LISTENING/SPEAKING)",
  );
  const greetings = foundations.lessons[0];
  console.log("sample exercise:", greetings.exercises[0].prompt);

  const draft = await db.lesson.create({
    data: {
      moduleId: foundations.id,
      title: "SECRET DRAFT LESSON",
      order: 99,
      status: "DRAFT",
    },
  });
  const afterDraft = await getPublishedCourse("es", "A1");
  const leaked = afterDraft!.modules.some((m) =>
    m.lessons.some((l) => l.id === draft.id),
  );
  assert(!leaked, "DRAFT lesson leaked through published query");

  await db.lesson.delete({ where: { id: draft.id } });

  const french = await getPublishedCourse("fr", "A1");
  assert(french === null, "French A1 should not exist yet");

  console.log("PHASE 2 VERIFICATION PASSED");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
