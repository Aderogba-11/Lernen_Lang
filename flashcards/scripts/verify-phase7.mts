import "dotenv/config";
import { db } from "../lib/db";
import { scoreLessonReading, getSessionContent } from "../lib/sessions";
import { scoreReading } from "../lib/scoring";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase7-test@test.local";

async function main() {
  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });

  const readingExercises = await db.exercise.findMany({
    where: { type: "READING", status: "PUBLISHED", lesson: { module: { courseId: course.id } } },
    include: { lesson: { include: { module: true } } },
  });
  assert(readingExercises.length === 6, `expected 6 reading exercises, got ${readingExercises.length}`);

  const moduleTitles = new Set<string>();
  for (const exercise of readingExercises) {
    moduleTitles.add(exercise.lesson.module.title);
    assert(exercise.lesson.order === 1, `reading should live in first lesson of ${exercise.lesson.module.title}`);
    const content = exercise.content as {
      kind?: string;
      passage?: string;
      questions?: { prompt?: string; options?: string[]; answerIndex?: number }[];
    };
    assert(content.kind === "reading", `bad kind in ${exercise.id}`);
    assert(typeof content.passage === "string" && content.passage.length > 60, `passage too short in ${exercise.id}`);
    assert(Array.isArray(content.questions) && content.questions.length >= 2, `too few questions in ${exercise.id}`);
    for (const q of content.questions!) {
      assert(Array.isArray(q.options) && q.options.length === 4, `question needs 4 options (${exercise.id})`);
      assert(
        typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex < 4,
        `answerIndex out of range (${exercise.id})`,
      );
    }
  }
  assert(moduleTitles.size === 6, `readings should span 6 modules, got ${moduleTitles.size}`);

  const unit = scoreReading(
    [
      { prompt: "q1", options: ["a", "b", "c", "d"], answerIndex: 2 },
      { prompt: "q2", options: ["a", "b", "c", "d"], answerIndex: 0 },
    ],
    [2, 3],
  );
  assert(!("error" in unit), "unit scoring failed");
  if (!("error" in unit)) {
    assert(unit.correct === 1 && unit.total === 2, `unit score wrong: ${JSON.stringify(unit)}`);
    assert(unit.results[0] === true && unit.results[1] === false, "unit results wrong");
  }

  const bad = scoreReading(
    [{ prompt: "q", options: ["a", "b"], answerIndex: 0 }],
    [5],
  );
  assert("error" in bad, "out-of-range selection should error");

  await db.user.deleteMany({ where: { email: EMAIL } });
  const user = await db.user.create({
    data: { id: "phase7-test-user", email: EMAIL, name: "Phase Seven", createdAt: new Date(), updatedAt: new Date() },
  });
  try {
    const lesson = course.modules[0]!.lessons[0]!;
    const exercise = readingExercises.find((e) => e.lessonId === lesson.id)!;
    const content = exercise.content as { questions: { answerIndex: number }[] };

    const unenrolled = await scoreLessonReading(user.id, lesson.id, exercise.id, content.questions.map((q) => q.answerIndex));
    assert(!unenrolled.ok, "unenrolled user should not score");

    assert((await startLanguageForUser(user.id, "es", "A1")).ok, "enrollment failed");

    const wrongLen = await scoreLessonReading(user.id, lesson.id, exercise.id, []);
    assert(!wrongLen.ok, "wrong number of selections should be rejected");

    const perfect = await scoreLessonReading(
      user.id,
      lesson.id,
      exercise.id,
      content.questions.map((q) => q.answerIndex),
    );
    assert(perfect.ok && perfect.correct === perfect.total, "perfect run should be all correct");

    const session = await getSessionContent(user.id, lesson.id);
    assert(!("error" in session), "session load failed");
    if (!("error" in session)) {
      assert(session.reading !== null, "session should include reading");
      if (session.reading) {
        assert(session.reading.passage.length > 60, "session passage missing");
        assert(
          session.reading.questions.every((q) => q.options.length === 4),
          "client-facing questions must not leak answers but keep options",
        );
        const leaked = JSON.stringify(session).includes("answerIndex");
        assert(!leaked, "answerIndex leaked to client payload");
      }
    }

    console.log("PHASE 7 VERIFICATION PASSED");
  } finally {
    await db.user.deleteMany({ where: { email: EMAIL } });
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
