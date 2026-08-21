import "dotenv/config";
import { db } from "../lib/db";
import { getPublishedCourse } from "../lib/catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EXPECTED_MODULES = [
  "Foundations",
  "Numbers and Time",
  "People",
  "Everyday Life",
  "Out and About",
  "Free Time",
];

const KINDS = ["translation", "fill-blank", "word-order"] as const;

async function main() {
  const course = await getPublishedCourse("es", "A1");
  assert(course, "Spanish A1 course not found");

  const modules = course!.modules;
  assert(modules.length === 6, `expected 6 modules, got ${modules.length}`);
  assert(
    modules.map((m) => m.title).join("|") === EXPECTED_MODULES.join("|"),
    `module titles/order mismatch: ${modules.map((m) => m.title).join("|")}`,
  );
  assert(
    modules.every((m) => m.order === EXPECTED_MODULES.indexOf(m.title) + 1),
    "module order values wrong",
  );

  let lessonTotal = 0;
  for (const mod of modules) {
    const lessons = mod.lessons;
    assert(lessons.length === 3, `module ${mod.title}: expected 3 lessons, got ${lessons.length}`);
    assert(
      lessons.map((l) => l.order).join(",") === "1,2,3",
      `module ${mod.title}: lesson order wrong`,
    );
    for (const lesson of lessons) {
      lessonTotal += 1;
      assert(
        lesson.status === "PUBLISHED",
        `${mod.title}/${lesson.title} not PUBLISHED`,
      );
      assert(
        typeof lesson.objective === "string" && lesson.objective.length > 10,
        `${mod.title}/${lesson.title} missing objective`,
      );
      assert(
        typeof lesson.notes === "string" && lesson.notes.length > 20,
        `${mod.title}/${lesson.title} missing notes`,
      );
      assert(
        lesson.exercises.length === 3 || lesson.exercises.length === 4,
        `${mod.title}/${lesson.title}: expected 3-4 exercises, got ${lesson.exercises.length}`,
      );
      const kinds = lesson.exercises.map(
        (e) => (e.content as { kind?: string }).kind,
      );
      assert(
        KINDS.every((k) => kinds.includes(k)),
        `${mod.title}/${lesson.title}: exercise kind mix wrong (${kinds.join(",")})`,
      );
      if (lesson.exercises.length === 4) {
        const extra = lesson.exercises[3]!;
        assert(
          extra.type === "READING" && kinds[3] === "reading",
          `${mod.title}/${lesson.title}: 4th exercise should be READING`,
        );
      }
      for (const [eIndex, exercise] of lesson.exercises.entries()) {
        const expectedType = eIndex === 3 ? "READING" : "WRITING";
        assert(exercise.type === expectedType, `exercise ${exercise.id} type != ${expectedType}`);
        assert(exercise.prompt.length > 5, `exercise ${exercise.id} prompt too short`);
        if (expectedType === "WRITING") {
          const answer = exercise.answer as { expected?: string } | null;
          assert(
            !!answer && typeof answer.expected === "string" && answer.expected.length > 0,
            `exercise ${exercise.id} missing answer.expected`,
          );
        }
      }
    }
  }
  assert(lessonTotal === 18, `expected 18 lessons total, got ${lessonTotal}`);

  const dbExercises = await db.exercise.count({
    where: { lesson: { module: { courseId: course!.id } }, status: "PUBLISHED" },
  });
  assert(dbExercises === 60, `expected 60 published exercises in DB, got ${dbExercises}`);

  console.log(`PHASE 4 VERIFICATION PASSED (${modules.length} modules, ${lessonTotal} lessons, ${dbExercises} exercises)`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
