import "dotenv/config";
import { db } from "../lib/db";
import {
  scoreLessonReading,
  scoreLessonListening,
  scoreLessonWriting,
  scoreLessonSpeaking,
} from "../lib/sessions";
import { getLearnerStats } from "../lib/stats";
import type { ReadingQuestion } from "../lib/scoring";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL_A = "phase11-test@test.local";
const EMAIL_B = "phase11-unenrolled@test.local";

async function createUser(id: string, email: string) {
  await db.user.deleteMany({ where: { email } });
  return db.user.create({
    data: { id, email, name: `Phase Eleven ${id}`, createdAt: new Date(), updatedAt: new Date() },
  });
}

async function main() {
  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  const module1 = course.modules[0]!;
  const lesson1 = module1.lessons[0]!;
  const lesson2 = module1.lessons[1]!;
  const lesson3 = module1.lessons[2]!;

  async function exerciseOf(lessonId: string, type: string) {
    return db.exercise.findFirstOrThrow({
      where: { lessonId, type, status: "PUBLISHED" },
    });
  }

  await createUser("phase11-user-a", EMAIL_A);
  await createUser("phase11-user-b", EMAIL_B);
  try {
    assert((await startLanguageForUser("phase11-user-a", "es", "A1")).ok, "enroll A failed");

    // --- unenrolled user records nothing ---
    const readingEx = await exerciseOf(lesson1.id, "READING");
    const readingContent = readingEx.content as { questions: ReadingQuestion[] };
    const unenrolledResult = await scoreLessonReading(
      "phase11-user-b",
      lesson1.id,
      readingEx.id,
      readingContent.questions.map((q) => q.answerIndex),
    );
    assert(!unenrolledResult.ok, "unenrolled scoring should fail");
    const bAttempts = await db.exerciseAttempt.count({ where: { userId: "phase11-user-b" } });
    assert(bAttempts === 0, "unenrolled user must have zero attempts");

    // --- reading: wrong first, then perfect ---
    const allWrong = readingContent.questions.map((q) => (q.answerIndex + 1) % q.options.length);
    const wrongRun = await scoreLessonReading("phase11-user-a", lesson1.id, readingEx.id, allWrong);
    assert(wrongRun.ok && !("error" in wrongRun), "wrong reading run should still be ok");
    if (!("error" in wrongRun)) {
      assert(wrongRun.correct < wrongRun.total, "all-wrong selections should score below total");
    }

    const perfectRun = await scoreLessonReading(
      "phase11-user-a",
      lesson1.id,
      readingEx.id,
      readingContent.questions.map((q) => q.answerIndex),
    );
    assert(perfectRun.ok && !("error" in perfectRun), "perfect reading run failed");
    if (!("error" in perfectRun)) {
      assert(perfectRun.correct === perfectRun.total, "perfect run should equal total");
    }

    const readingProgress = await db.exerciseProgress.findUniqueOrThrow({
      where: { userId_exerciseId: { userId: "phase11-user-a", exerciseId: readingEx.id } },
    });
    assert(readingProgress.attemptCount === 2, `reading attemptCount should be 2, got ${readingProgress.attemptCount}`);
    assert(readingProgress.completed === true, "completed should flip true after perfect run");
    assert(readingProgress.latestPassed === true, "latestPassed should be true");
    assert(
      readingProgress.bestCorrect === readingContent.questions.length,
      `bestCorrect should reach total (${readingContent.questions.length}), got ${readingProgress.bestCorrect}`,
    );
    const readingAttemptRows = await db.exerciseAttempt.count({
      where: { userId: "phase11-user-a", exerciseId: readingEx.id },
    });
    assert(readingAttemptRows === 2, "two append-only reading attempts expected");

    // --- writing: fail then pass ---
    const writingEx = await exerciseOf(lesson1.id, "WRITING");
    const writingAnswer = writingEx.answer as { expected: string };
    const badWriting = await scoreLessonWriting("phase11-user-a", lesson1.id, writingEx.id, "zzz incorrect zzz");
    assert(badWriting.ok && !badWriting.correct, "bad writing should return correct=false");
    const goodWriting = await scoreLessonWriting(
      "phase11-user-a",
      lesson1.id,
      writingEx.id,
      `${writingAnswer.expected}.`,
    );
    assert(goodWriting.ok && goodWriting.correct, "expected-based writing should pass");

    const writingProgress = await db.exerciseProgress.findUniqueOrThrow({
      where: { userId_exerciseId: { userId: "phase11-user-a", exerciseId: writingEx.id } },
    });
    assert(writingProgress.attemptCount === 2, "writing attemptCount should be 2");
    assert(writingProgress.completed === true, "writing completed should be true");
    assert(writingProgress.bestCorrect === 1 && writingProgress.bestTotal === 1, "writing binary scoring stored");

    // --- listening + speaking single passes ---
    const listeningEx = await exerciseOf(lesson2.id, "LISTENING");
    const listeningContent = listeningEx.content as { questions: ReadingQuestion[] };
    const listenRun = await scoreLessonListening(
      "phase11-user-a",
      lesson2.id,
      listeningEx.id,
      listeningContent.questions.map((q) => q.answerIndex),
    );
    assert(listenRun.ok && !("error" in listenRun), "listening perfect run failed");

    const speakingEx = await exerciseOf(lesson3.id, "SPEAKING");
    const speakingContent = speakingEx.content as { targetText: string };
    const speakRun = await scoreLessonSpeaking(
      "phase11-user-a",
      lesson3.id,
      speakingEx.id,
      `${speakingContent.targetText.toLowerCase()}`,
    );
    assert(speakRun.ok && speakRun.correct, "speaking normalized run should pass");

    const totalAttempts = await db.exerciseAttempt.count({ where: { userId: "phase11-user-a" } });
    assert(totalAttempts === 6, `expected 6 total attempts, got ${totalAttempts}`);

    // --- stats aggregates match raw counts ---
    const stats = await getLearnerStats("phase11-user-a");
    assert(stats.enrolled, "stats should report enrolled");
    if (stats.enrolled) {
      assert(stats.languageName === "Spanish", "language name mismatch");
      assert(stats.lessonsTotal === 18, `18 lessons expected, got ${stats.lessonsTotal}`);
      assert(stats.attemptsTotal === 6, `stats attemptsTotal should be 6, got ${stats.attemptsTotal}`);
      assert(stats.modules.length === 6, "six modules expected in stats");
      const mod1 = stats.modules[0]!;
      assert(mod1.skills.some((s) => s.skill === "READING"), "module 1 skills should include READING");
      assert(mod1.skills.every((s) => s.total > 0), "module 1 skills should have nonzero totals");
      assert(stats.recent.length === 6, "recent list should contain our 6 attempts");
      assert(stats.activity.some((d) => d.count > 0), "today's activity bucket should be > 0");

      const unenrolledStats = await getLearnerStats("phase11-user-b");
      assert(!unenrolledStats.enrolled, "unenrolled stats should report enrolled:false");
    }

    console.log("PHASE 11 VERIFICATION PASSED (attempts persisted, progress summaries, stats aggregates)");
  } finally {
    await db.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
