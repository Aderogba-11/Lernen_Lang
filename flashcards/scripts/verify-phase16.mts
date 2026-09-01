import "dotenv/config";
import { db } from "../lib/db";
import { getCourseNavigation, isLessonUnlocked, type CourseNavigation, type LessonStatus } from "../lib/course";
import { getPublishedCourse } from "../lib/catalog";
import { startLanguageForUser } from "../lib/enrollments";
import { getSessionContent, completeLesson, rateFlashcard } from "../lib/sessions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase16-test@test.local";
const EMAIL_B = "phase16-test-b@test.local";
const NOW = new Date();

function statusOf(
  nav: Extract<CourseNavigation, { enrolled: true }>,
  moduleIndex: number,
  lessonIndex: number,
): LessonStatus {
  return nav.modules[moduleIndex]!.lessons[lessonIndex]!.status;
}

async function main() {
  await db.user.deleteMany({ where: { email: { in: [EMAIL, EMAIL_B] } } });
  await db.user.create({
    data: { id: "phase16-user", email: EMAIL, name: "Phase16", createdAt: NOW, updatedAt: NOW },
  });

  try {
    const enroll = await startLanguageForUser("phase16-user", "es", "A1");
    assert(enroll.ok, "enrollment ok");

    const course = await getPublishedCourse("es", "A1");
    assert(course, "published course exists");
    const lessonsPerModule = course.modules.map((m) => m.lessons);
    assert(lessonsPerModule.length >= 2, "at least two modules");
    assert(lessonsPerModule[0]!.length >= 2, "module 1 has at least two lessons");
    const lesson11 = lessonsPerModule[0]![0]!;
    const lesson12 = lessonsPerModule[0]![1]!;
    const lesson21 = lessonsPerModule[1]![0]!;

    // ── Fresh nav: first available, rest locked ─────────────────────────
    let nav = await getCourseNavigation("phase16-user");
    if (nav.enrolled) {
      assert(statusOf(nav, 0, 0) === "AVAILABLE", "module 1 lesson 1 available");
      assert(statusOf(nav, 0, 1) === "LOCKED", "module 1 lesson 2 locked");
      assert(statusOf(nav, 1, 0) === "LOCKED", "module 2 lesson 1 locked (module chain)");
      assert(nav.nextLessonId === lesson11.id, "next up is lesson 1-1");
      assert(nav.modules[0]!.completed === 0, "module 1 progress 0");
    }

    // ── Locked lesson is rejected at every entry point ──────────────────
    const sessionLocked = await getSessionContent("phase16-user", lesson12.id);
    assert("error" in sessionLocked, "getSessionContent rejects locked lesson 1-2");
    const session21 = await getSessionContent("phase16-user", lesson21.id);
    assert("error" in session21, "getSessionContent rejects locked module-2 lesson");

    const completeLocked = await completeLesson("phase16-user", lesson12.id);
    assert(!completeLocked.ok, "completeLesson refuses locked lesson");

    const card12 = await db.flashcard.findFirst({
      where: { lessonId: lesson12.id, status: "PUBLISHED" },
    });
    if (card12) {
      const rateLocked = await rateFlashcard("phase16-user", card12.id, "GOOD");
      assert(!rateLocked.ok, "rateFlashcard refuses locked lesson card");
    }

    // ── Lesson 1 is open and completeable ───────────────────────────────
    const sessionOpen = await getSessionContent("phase16-user", lesson11.id);
    assert(!("error" in sessionOpen), "lesson 1-1 session loads");

    // Partial activity flips 1-1 to in-progress
    const ex11 = await db.exercise.findFirstOrThrow({
      where: { lessonId: lesson11.id, status: "PUBLISHED" },
    });
    await db.exerciseAttempt.create({
      data: {
        userId: "phase16-user",
        exerciseId: ex11.id,
        lessonId: lesson11.id,
        response: {},
        score: {},
        correct: 0,
        total: 1,
        passed: false,
      },
    });

    nav = await getCourseNavigation("phase16-user");
    if (nav.enrolled) {
      assert(statusOf(nav, 0, 0) === "IN_PROGRESS", "partial attempt → lesson 1-1 in progress");
      assert(statusOf(nav, 0, 1) === "LOCKED", "lesson 1-2 still locked");
    }

    // ── Complete 1-1: 1-2 unlocks, module 2 stays locked ────────────────
    const done1 = await completeLesson("phase16-user", lesson11.id);
    assert(done1.ok, "complete lesson 1-1");
    nav = await getCourseNavigation("phase16-user");
    if (nav.enrolled) {
      assert(statusOf(nav, 0, 0) === "COMPLETED", "lesson 1-1 completed");
      assert(statusOf(nav, 0, 1) === "AVAILABLE", "lesson 1-2 now available");
      assert(statusOf(nav, 1, 0) === "LOCKED", "module 2 still chain-locked");
      assert(nav.nextLessonId === lesson12.id, "next up is lesson 1-2");
      assert(nav.modules[0]!.completed === 1, "module 1 progress 1");
    }

    const second = await getSessionContent("phase16-user", lesson12.id);
    assert(!("error" in second), "lesson 1-2 session now loads");

    // ── Complete the whole module: module 2 unlocks ─────────────────────
    for (const lesson of lessonsPerModule[0]!) {
      const r = await completeLesson("phase16-user", lesson.id);
      assert(r.ok, `complete module-1 lesson ${lesson.id}`);
    }

    nav = await getCourseNavigation("phase16-user");
    if (nav.enrolled) {
      assert(nav.modules[0]!.completed === nav.modules[0]!.total, "module 1 fully complete");
      assert(statusOf(nav, 1, 0) === "AVAILABLE", "module 2 lesson 1 now available");
      assert(nav.nextLessonId === lesson21.id, "next up is module-2 lesson 1");
      // Completed lessons stay open for practice
      const replay = await getSessionContent("phase16-user", lesson11.id);
      assert(!("error" in replay), "completed lesson stays open");
    }

    // ── Auth isolation ──────────────────────────────────────────────────
    await db.user.create({
      data: { id: "phase16-user-b", email: EMAIL_B, name: "B", createdAt: NOW, updatedAt: NOW },
    });
    try {
      const bNav = await getCourseNavigation("phase16-user-b");
      assert(!bNav.enrolled, "user B has no course navigation");
      const bUnlocked = await isLessonUnlocked("phase16-user-b", lesson11.id);
      assert(!bUnlocked, "user B cannot unlock any lesson");
      const bSession = await getSessionContent("phase16-user-b", lesson11.id);
      assert("error" in bSession, "user B cannot open lesson sessions");
    } finally {
      await db.user.deleteMany({ where: { email: EMAIL_B } });
    }

    console.log("PHASE 16 VERIFICATION PASSED (lesson locking, in-progress state, module chain, unlock flow, auth isolation)");
  } finally {
    await db.user.deleteMany({ where: { email: { in: [EMAIL, EMAIL_B] } } });
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());