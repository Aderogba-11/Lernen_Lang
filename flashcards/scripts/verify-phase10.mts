import "dotenv/config";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { db } from "../lib/db";
import { scoreLessonSpeaking, getSessionContent, completeLesson } from "../lib/sessions";
import { scoreWriting } from "../lib/scoring";
import { SPEAKINGS } from "../prisma/speaking-content";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase10-test@test.local";

async function main() {
  assert(SPEAKINGS.length === 6, `expected 6 speaking items, got ${SPEAKINGS.length}`);

  for (const item of SPEAKINGS) {
    const filePath = path.resolve(`public/audio/es/speaking/${item.slug}.mp3`);
    assert(existsSync(filePath), `missing audio file: ${filePath}`);
    const size = statSync(filePath).size;
    assert(size > 10000, `audio file too small (${size} bytes): ${item.slug}.mp3`);
  }

  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });

  const speakingExercises = await db.exercise.findMany({
    where: { type: "SPEAKING", status: "PUBLISHED", lesson: { module: { courseId: course.id } } },
    include: { lesson: true },
  });
  assert(speakingExercises.length === 6, `expected 6 speaking exercises in DB, got ${speakingExercises.length}`);

  for (const exercise of speakingExercises) {
    assert(exercise.lesson.order === 3, `speaking should live in lesson 3 (got lesson order ${exercise.lesson.order})`);
    const content = exercise.content as {
      kind?: string;
      targetText?: string;
      translation?: string;
      audioUrl?: string;
    };
    assert(content.kind === "speaking", `bad kind in ${exercise.id}`);
    assert(typeof content.targetText === "string" && content.targetText.length > 10, `targetText missing in ${exercise.id}`);
    assert(typeof content.translation === "string", `translation missing in ${exercise.id}`);
    assert(typeof content.audioUrl === "string" && content.audioUrl.startsWith("/audio/es/speaking/"), `bad audioUrl in ${exercise.id}`);
    assert(existsSync(path.resolve(`public${content.audioUrl}`)), `audioUrl points to missing file: ${content.audioUrl}`);
  }

  assert(scoreWriting("Me llamo Ana.", [], "me llamo ana"), "punctuation/case-insensitive match should pass");
  assert(!scoreWriting("Me llamo Ana.", [], "me llamo ana y soy de espana"), "wrong sentence must fail");

  await db.user.deleteMany({ where: { email: EMAIL } });
  const user = await db.user.create({
    data: { id: "phase10-test-user", email: EMAIL, name: "Phase Ten", createdAt: new Date(), updatedAt: new Date() },
  });
  try {
    const module1 = course.modules[0]!;
    const lesson = module1.lessons[2]!;
    const exercise = speakingExercises.find((e) => e.lessonId === lesson.id)!;
    const content = exercise.content as { targetText: string };

    const unenrolled = await scoreLessonSpeaking(user.id, lesson.id, exercise.id, "hola");
    assert(!unenrolled.ok, "unenrolled user should not score");

    assert((await startLanguageForUser(user.id, "es", "A1")).ok, "enrollment failed");

    for (const prior of [module1.lessons[0]!, module1.lessons[1]!]) {
      const pre = await completeLesson(user.id, prior.id);
      assert(pre.ok, `pre-complete lesson ${prior.order} to unlock speaking lesson`);
    }

    const empty = await scoreLessonSpeaking(user.id, lesson.id, exercise.id, "   ");
    assert(!empty.ok && empty.error.includes("speak"), "empty transcript should be rejected");

    const right = await scoreLessonSpeaking(
      user.id,
      lesson.id,
      exercise.id,
      `${content.targetText.toLowerCase().replace(/[.!?¡¿]/g, "")} `,
    );
    assert(right.ok && right.correct, "normalized transcript should pass");

    const wrong = await scoreLessonSpeaking(user.id, lesson.id, exercise.id, "no sé");
    assert(wrong.ok && !wrong.correct && wrong.expected === content.targetText, "wrong transcript should fail with expected text");

    const session = await getSessionContent(user.id, lesson.id);
    assert(!("error" in session), "session load failed");
    if (!("error" in session)) {
      assert(session.speaking !== null, "session should include speaking");
      if (session.speaking) {
        assert(session.speaking.audioUrl.startsWith("/audio/es/speaking/"), "client audioUrl wrong");
        const keys = Object.keys(session.speaking).sort();
        assert(
          JSON.stringify(keys) === JSON.stringify(["audioUrl", "id", "prompt", "targetText"]),
          `speaking payload has unexpected keys: ${keys.join(",")}`,
        );
      }
    }

    console.log("PHASE 10 VERIFICATION PASSED (6 audio files, 6 exercises, scoring + payload checks)");
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
