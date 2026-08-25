import "dotenv/config";
import { db } from "../lib/db";
import { scheduleCard } from "../lib/srs/scheduler";
import { getReviewQueue } from "../lib/review";
import { getLearnerStats } from "../lib/stats";
import { rateFlashcard } from "../lib/sessions";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase12-test@test.local";
const NOW = new Date();

async function main() {
  // ── Pure scheduler tests ─────────────────────────────────────────────

  // NEW + AGAIN → LEARNING, 10 min
  const s1 = scheduleCard(null, "AGAIN");
  assert(s1.state === "LEARNING", `NEW+AGAIN state, got ${s1.state}`);
  assert(Math.abs(s1.intervalDays - 10 / 1440) < 1e-9, `NEW+AGAIN interval ≈ 10min`);
  assert(s1.lapses === 0, "NEW+AGAIN no lapse");

  // NEW + GOOD → REVIEW, 1 day
  const s2 = scheduleCard(null, "GOOD");
  assert(s2.state === "REVIEW", `NEW+GOOD state, got ${s2.state}`);
  assert(Math.abs(s2.intervalDays - 1) < 1e-9, "NEW+GOOD interval 1d");

  // NEW + EASY → REVIEW, 3 days
  const s3 = scheduleCard(null, "EASY");
  assert(s3.state === "REVIEW", "NEW+EASY state");
  assert(Math.abs(s3.intervalDays - 3) < 1e-9, "NEW+EASY interval 3d");

  // REVIEW + HARD → ease reduced
  const s4 = scheduleCard(
    { state: "REVIEW", intervalDays: 10, easeFactor: 2.5, lapses: 0 },
    "HARD",
  );
  assert(s4.state === "REVIEW", "REVIEW+HARD stays REVIEW");
  assert(s4.intervalDays > 10, `REVIEW+HARD grows interval, got ${s4.intervalDays}`);
  assert(s4.easeFactor! < 2.5, `REVIEW+HARD ease drops, got ${s4.easeFactor}`);

  // REVIEW + AGAIN → LEARNING, lapses++
  const s5 = scheduleCard(
    { state: "REVIEW", intervalDays: 10, easeFactor: 2.5, lapses: 2 },
    "AGAIN",
  );
  assert(s5.state === "LEARNING", "REVIEW+AGAIN → LEARNING");
  assert(s5.lapses === 3, `REVIEW+AGAIN lapses 3, got ${s5.lapses}`);

  // Ease clamp lower bound
  const s6 = scheduleCard(
    { state: "REVIEW", intervalDays: 1, easeFactor: 1.35, lapses: 0 },
    "AGAIN",
  );
  assert(s6.easeFactor! >= 1.3, `ease clamp low, got ${s6.easeFactor}`);

  // ── DB integration tests ─────────────────────────────────────────────

  await db.user.deleteMany({ where: { email: EMAIL } });
  const user = await db.user.create({
    data: { id: "phase12-user", email: EMAIL, name: "Phase12", createdAt: NOW, updatedAt: NOW },
  });

  const course = await db.course.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  const lesson1 = course.modules[0]!.lessons[0]!;
  const lesson2 = course.modules[0]!.lessons[1]!;

  const card1 = await db.flashcard.findFirstOrThrow({
    where: { lessonId: lesson1.id, status: "PUBLISHED" },
  });
  const cardsInLesson1 = await db.flashcard.findMany({
    where: { lessonId: lesson1.id, status: "PUBLISHED" },
  });
  const card2 = cardsInLesson1.find((c) => c.id !== card1.id) ?? card1;

  try {
    const enroll = await startLanguageForUser("phase12-user", "es", "A1");
    assert(enroll.ok, "enrollment failed");

    // ── rateFlashcard persists all SRS fields ───────────────────────────

    await rateFlashcard("phase12-user", card1.id, "AGAIN");
    let fp1 = await db.flashcardProgress.findUniqueOrThrow({
      where: { userId_flashcardId: { userId: "phase12-user", flashcardId: card1.id } },
    });
    assert(fp1.state === "LEARNING", `rateFlashcard state, got ${fp1.state}`);
    assert(fp1.intervalDays !== null, "intervalDays written");
    assert(fp1.easeFactor !== null, "easeFactor written");
    assert(fp1.reviewCount === 1, `reviewCount 1, got ${fp1.reviewCount}`);

    await rateFlashcard("phase12-user", card1.id, "GOOD");
    fp1 = await db.flashcardProgress.findUniqueOrThrow({
      where: { userId_flashcardId: { userId: "phase12-user", flashcardId: card1.id } },
    });
    assert(fp1.state === "REVIEW", `after GOOD → REVIEW, got ${fp1.state}`);
    assert(fp1.reviewCount === 2, `reviewCount 2, got ${fp1.reviewCount}`);
    assert(fp1.lapses === 0, "no lapses yet");

    await rateFlashcard("phase12-user", card1.id, "AGAIN");
    fp1 = await db.flashcardProgress.findUniqueOrThrow({
      where: { userId_flashcardId: { userId: "phase12-user", flashcardId: card1.id } },
    });
    assert(fp1.state === "LEARNING", "REVIEW+AGAIN → LEARNING");
    assert(fp1.lapses === 1, `lapses incremented, got ${fp1.lapses}`);

    // Backdate card1's dueAt to make it immediately due for queue/stats testing
    await db.flashcardProgress.update({
      where: { userId_flashcardId: { userId: "phase12-user", flashcardId: card1.id } },
      data: { dueAt: new Date(Date.now() - 60_000) },
    });

    // card2: never rated
    const fp2 = await db.flashcardProgress.findUnique({
      where: { userId_flashcardId: { userId: "phase12-user", flashcardId: card2.id } },
    });
    assert(fp2 === null, "card2 has no progress yet");

    // ── Review queue ────────────────────────────────────────────────────

    // Complete lesson1 to make its cards eligible
    await db.userProgress.upsert({
      where: { userId_lessonId: { userId: "phase12-user", lessonId: lesson1.id } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: { userId: "phase12-user", lessonId: lesson1.id, status: "COMPLETED", completedAt: new Date() },
    });

    // card1 is LEARNING + dueAt backdated → now due
    // card2 is NEW → eligible as a new card
    const queue = await getReviewQueue("phase12-user");
    assert(queue.length >= 1, `queue has cards, got ${queue.length}`);
    const queueIds = queue.map((c) => c.id);
    assert(queueIds.includes(card1.id), "queue contains card1 (LEARNING, due)");
    assert(queueIds.includes(card2.id), "queue contains card2 (new, eligible)");

    // Lesson2 not completed → cards from it excluded (use a card from lesson2)
    const cardFromLesson2 = await db.flashcard.findFirst({
      where: { lessonId: lesson2.id, status: "PUBLISHED" },
    });
    if (cardFromLesson2) {
      const queue2 = await getReviewQueue("phase12-user");
      const ids2 = queue2.map((c) => c.id);
      assert(!ids2.includes(cardFromLesson2.id), "card from uncompleted lesson2 excluded");
    }

    // Queue cap: ≤ 15 cards
    assert(queue.length <= 15, `queue capped at 15, got ${queue.length}`);

    // Rate card2 through queue (GOOD) to seed a new progress row
    await rateFlashcard("phase12-user", card2.id, "GOOD");
    const fp2After = await db.flashcardProgress.findUniqueOrThrow({
      where: { userId_flashcardId: { userId: "phase12-user", flashcardId: card2.id } },
    });
    assert(fp2After.state === "REVIEW", "card2 after rating becomes REVIEW");
    assert(fp2After.intervalDays === 1, `card2 interval 1d, got ${fp2After.intervalDays}`);

    // ── Stats ───────────────────────────────────────────────────────────

    const stats = await getLearnerStats("phase12-user");
    assert(stats.enrolled, "enrolled");
    if (stats.enrolled) {
      assert(stats.dueNow >= 1, `dueNow ≥ 1, got ${stats.dueNow}`);
      assert(stats.reviewsToday >= 2, `reviewsToday ≥ 2, got ${stats.reviewsToday}`);
      assert(stats.cardsInRotation >= 2, `cardsInRotation ≥ 2, got ${stats.cardsInRotation}`);
      assert(stats.cardsInRotation <= 18, "cardsInRotation ≤ course total");
    }

    // ── Unenrolled gating ───────────────────────────────────────────────

    const user2 = await db.user.create({
      data: { id: "phase12-user-b", email: "phase12-test-b@test.local", name: "B", createdAt: NOW, updatedAt: NOW },
    });
    try {
      const emptyQ = await getReviewQueue(user2.id);
      assert(emptyQ.length === 0, "unenrolled gets empty queue");
      const emptyStats = await getLearnerStats(user2.id);
      assert(!emptyStats.enrolled, "unenrolled stats returns enrolled:false");
    } finally {
      await db.user.deleteMany({ where: { email: "phase12-test-b@test.local" } });
    }

    console.log("PHASE 12 VERIFICATION PASSED (scheduler, persistence, queue, stats)");
  } finally {
    await db.user.deleteMany({ where: { email: { in: [EMAIL, "phase12-test-b@test.local"] } } });
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
