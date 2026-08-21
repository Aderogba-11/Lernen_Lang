import "dotenv/config";
import { db } from "../lib/db";
import { scoreLessonWriting, getSessionContent } from "../lib/sessions";
import { normalizeWriting, scoreWriting } from "../lib/scoring";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase9-test@test.local";

async function main() {
  assert(normalizeWriting("  ¡Hola, Mundo!  ") === "hola mundo", "normalize should strip punctuation/case");
  assert(scoreWriting("Buenos días.", ["buenos dias"], " buenos días. "), "expected match with punctuation");
  assert(scoreWriting("gracias", ["muchas gracias"], "Muchas gracias"), "accept variant should pass");
  assert(!scoreWriting("días", [], "dias"), "accent mismatch must fail without accept variant");
  assert(!scoreWriting("hola", [], ""), "empty response must fail");

  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });

  const writingExercises = await db.exercise.findMany({
    where: { type: "WRITING", status: "PUBLISHED", lesson: { module: { courseId: course.id } } },
    include: { lesson: true },
    orderBy: [{ lesson: { module: { order: "asc" } } }, { lesson: { order: "asc" } }, { order: "asc" }],
  });
  assert(writingExercises.length === 54, `expected 54 writing exercises, got ${writingExercises.length}`);

  const kinds = new Set<string>();
  for (const exercise of writingExercises) {
    const content = exercise.content as { kind?: string };
    const answer = exercise.answer as { expected?: string; accept?: string[] };
    assert(typeof content.kind === "string", `missing kind in ${exercise.id}`);
    kinds.add(content.kind);
    assert(typeof answer.expected === "string" && answer.expected.length > 0, `missing expected in ${exercise.id}`);
    if (Array.isArray(answer.accept)) {
      assert(answer.accept.every((v) => typeof v === "string"), `bad accept in ${exercise.id}`);
    }
  }
  assert(
    kinds.has("translation") && kinds.has("fill-blank") && kinds.has("word-order"),
    `kinds missing: ${[...kinds].join(",")}`,
  );

  await db.user.deleteMany({ where: { email: EMAIL } });
  const user = await db.user.create({
    data: { id: "phase9-test-user", email: EMAIL, name: "Phase Nine", createdAt: new Date(), updatedAt: new Date() },
  });
  try {
    const first = writingExercises[0]!;
    const lessonId = first.lessonId;

    const unenrolled = await scoreLessonWriting(user.id, lessonId, first.id, "anything");
    assert(!unenrolled.ok, "unenrolled user should not score");

    assert((await startLanguageForUser(user.id, "es", "A1")).ok, "enrollment failed");

    const empty = await scoreLessonWriting(user.id, lessonId, first.id, "   ");
    assert(!empty.ok && empty.error.includes("write"), "empty response should be rejected");

    const right = await scoreLessonWriting(user.id, lessonId, first.id, `${(first.answer as { expected: string }).expected}!`);
    assert(right.ok && right.correct, "exact expected (with punctuation) should pass");

    const session = await getSessionContent(user.id, lessonId);
    assert(!("error" in session), "session load failed");
    if (!("error" in session)) {
      assert(session.writings.length === 3, `lesson should expose 3 writings, got ${session.writings.length}`);
      const serialized = JSON.stringify(session);
      assert(!serialized.includes("expected"), "expected answers leaked to client");
      assert(!serialized.includes('"accept"'), "accept variants leaked to client");
    }

    console.log("PHASE 9 VERIFICATION PASSED (54 writing exercises, scoring + payload checks)");
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
