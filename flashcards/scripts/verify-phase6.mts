import "dotenv/config";
import { db } from "../lib/db";
import {
  completeLesson,
  getSessionContent,
  rateFlashcard,
  getCompletedLessonIds,
} from "../lib/sessions";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase6-test@test.local";

async function createTestUser() {
  await db.user.deleteMany({ where: { email: EMAIL } });
  return db.user.create({
    data: {
      id: "phase6-test-user",
      email: EMAIL,
      name: "Phase Six",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function cleanup() {
  await db.user.deleteMany({ where: { email: EMAIL } });
}

async function main() {
  const user = await createTestUser();
  try {
    const course = await db.course.findFirstOrThrow({
      where: { status: "PUBLISHED" },
      include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } },
    });
    const lesson = course.modules[0]!.lessons[0]!;
    const otherLesson = course.modules[0]!.lessons[1]!;

    const unenrolled = await getSessionContent(user.id, lesson.id);
    assert("error" in unenrolled, "unenrolled user should not load session");

    const enroll = await startLanguageForUser(user.id, "es", "A1");
    assert(enroll.ok, `enrollment failed: ${JSON.stringify(enroll)}`);

    const draft = await db.lesson.create({
      data: { moduleId: course.modules[0]!.id, title: "DRAFT", order: 98, status: "DRAFT" },
    });
    const draftSession = await getSessionContent(user.id, draft.id);
    assert("error" in draftSession, "draft lesson should be rejected");
    const unrelatedCard = await db.flashcard.findFirstOrThrow({
      where: { lessonId: otherLesson.id },
    });
    const draftRate = await rateFlashcard(user.id, unrelatedCard.id, "GOOD");
    assert(draftRate.ok, "rating a published card should work");
    await db.lesson.delete({ where: { id: draft.id } });

    const session = await getSessionContent(user.id, lesson.id);
    assert(!("error" in session), "enrolled user should load session");
    assert(session.cards.length === 8, `expected 8 cards, got ${session.cards.length}`);
    assert(
      session.cards.every((c) => c.targetText && c.translation),
      "cards missing text",
    );
    assert(session.completed === false, "fresh session should not be completed");

    const badRating = await rateFlashcard(user.id, session.cards[0]!.id, "PERFECT" as never);
    assert(!badRating.ok, "invalid rating should be rejected");

    const rate1 = await rateFlashcard(user.id, session.cards[0]!.id, "GOOD");
    assert(rate1.ok, "valid rating failed");
    const progress1 = await db.flashcardProgress.findUniqueOrThrow({
      where: { userId_flashcardId: { userId: user.id, flashcardId: session.cards[0]!.id } },
    });
    assert(progress1.reviewCount === 1 && progress1.lastRating === "GOOD", "progress wrong after first rating");

    await rateFlashcard(user.id, session.cards[0]!.id, "EASY");
    const progress2 = await db.flashcardProgress.findUniqueOrThrow({
      where: { userId_flashcardId: { userId: user.id, flashcardId: session.cards[0]!.id } },
    });
    assert(progress2.reviewCount === 2 && progress2.lastRating === "EASY", "upsert should increment count + update rating");

    for (const card of session.cards.slice(1)) {
      await rateFlashcard(user.id, card.id, "GOOD");
    }

    const done1 = await completeLesson(user.id, lesson.id);
    assert(done1.ok, "completeLesson failed");
    const done2 = await completeLesson(user.id, lesson.id);
    assert(done2.ok, "completeLesson should be idempotent");
    const completions = await db.userProgress.count({ where: { userId: user.id } });
    assert(completions === 1, `expected 1 completion row, got ${completions}`);

    const reloaded = await getSessionContent(user.id, lesson.id);
    assert(!("error" in reloaded) && reloaded.completed, "session should report completed");

    const completedIds = await getCompletedLessonIds(user.id, [lesson.id, otherLesson.id]);
    assert(
      completedIds.length === 1 && completedIds[0] === lesson.id,
      "completed ids wrong",
    );

    console.log("PHASE 6 VERIFICATION PASSED");
  } finally {
    await cleanup();
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
