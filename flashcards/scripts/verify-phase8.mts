import "dotenv/config";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { db } from "../lib/db";
import { scoreLessonListening, getSessionContent } from "../lib/sessions";
import { scoreMcq } from "../lib/scoring";
import { LISTENINGS } from "../prisma/listening-content";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase8-test@test.local";

async function main() {
  assert(LISTENINGS.length === 6, `expected 6 listening items, got ${LISTENINGS.length}`);

  for (const item of LISTENINGS) {
    const filePath = path.resolve(`public/audio/es/listening/${item.slug}.mp3`);
    assert(existsSync(filePath), `missing audio file: ${filePath}`);
    const size = statSync(filePath).size;
    assert(size > 10000, `audio file too small (${size} bytes): ${item.slug}.mp3`);
    assert(item.questions.length === 3, `${item.slug}: expected 3 questions`);
    for (const q of item.questions) {
      assert(q.options.length === 4, `${item.slug}: question needs 4 options`);
      assert(q.answerIndex >= 0 && q.answerIndex < 4, `${item.slug}: answerIndex out of range`);
    }
  }

  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });

  const listeningExercises = await db.exercise.findMany({
    where: { type: "LISTENING", status: "PUBLISHED", lesson: { module: { courseId: course.id } } },
    include: { lesson: { include: { module: true } } },
  });
  assert(listeningExercises.length === 6, `expected 6 listening exercises in DB, got ${listeningExercises.length}`);

  for (const exercise of listeningExercises) {
    assert(exercise.lesson.order === 2, `listening should live in lesson 2 of ${exercise.lesson.module.title}`);
    const content = exercise.content as {
      kind?: string;
      audioUrl?: string;
      transcript?: string;
      questions?: unknown[];
    };
    assert(content.kind === "listening", `bad kind in ${exercise.id}`);
    assert(typeof content.audioUrl === "string" && content.audioUrl.startsWith("/audio/es/listening/"), `bad audioUrl in ${exercise.id}`);
    assert(existsSync(path.resolve(`public${content.audioUrl}`)), `audioUrl points to missing file: ${content.audioUrl}`);
    assert(typeof content.transcript === "string" && content.transcript.length > 40, `transcript missing in ${exercise.id}`);
    assert(Array.isArray(content.questions) && content.questions.length === 3, `questions wrong in ${exercise.id}`);
  }

  await db.user.deleteMany({ where: { email: EMAIL } });
  const user = await db.user.create({
    data: { id: "phase8-test-user", email: EMAIL, name: "Phase Eight", createdAt: new Date(), updatedAt: new Date() },
  });
  try {
    const module1 = course.modules[0]!;
    const lesson = module1.lessons[1]!;
    const exercise = listeningExercises.find((e) => e.lessonId === lesson.id)!;
    const content = exercise.content as { questions: { answerIndex: number }[] };

    const unenrolled = await scoreLessonListening(user.id, lesson.id, exercise.id, [0, 0, 0]);
    assert(!unenrolled.ok, "unenrolled user should not score");

    assert((await startLanguageForUser(user.id, "es", "A1")).ok, "enrollment failed");

    const perfect = await scoreLessonListening(
      user.id,
      lesson.id,
      exercise.id,
      content.questions.map((q) => q.answerIndex),
    );
    assert(perfect.ok && perfect.correct === 3, "perfect run should score 3/3");

    const session = await getSessionContent(user.id, lesson.id);
    assert(!("error" in session), "session load failed");
    if (!("error" in session)) {
      assert(session.listening !== null, "session should include listening");
      if (session.listening) {
        assert(session.listening.audioUrl.startsWith("/audio/es/listening/"), "client audioUrl wrong");
        const serialized = JSON.stringify(session);
        assert(!serialized.includes("answerIndex"), "answerIndex leaked to client");
        assert(!serialized.includes("transcript"), "transcript leaked to client");
      }
    }

    const unit = scoreMcq(
      [{ prompt: "q", options: ["a", "b"], answerIndex: 1 }],
      [9],
    );
    assert("error" in unit, "out-of-range selection should error");

    console.log("PHASE 8 VERIFICATION PASSED (6 audio files, 6 exercises, scoring + payload checks)");
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
