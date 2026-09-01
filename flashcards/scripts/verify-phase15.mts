import "dotenv/config";
import { db } from "../lib/db";
import { getDashboardData } from "../lib/dashboard";
import { getPublishedCourse } from "../lib/catalog";
import { startLanguageForUser, setActiveEnrollmentForUser } from "../lib/enrollments";
import { completeLesson } from "../lib/sessions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase15-test@test.local";
const NOW = new Date();
const TODAY_START = new Date(NOW);
TODAY_START.setUTCHours(0, 0, 0, 0);

async function main() {
  await db.user.deleteMany({ where: { email: EMAIL } });
  await db.user.create({
    data: { id: "phase15-user", email: EMAIL, name: "Phase15", createdAt: NOW, updatedAt: NOW },
  });

  // Fake second language used only to exercise the "Other languages" path.
  await db.language.deleteMany({ where: { code: "xx_test" } });
  const level = await db.level.findUniqueOrThrow({ where: { code: "A1" } });
  const fakeCourse = await db.course.create({
    data: {
      title: "Test course",
      status: "PUBLISHED",
      language: { create: { code: "xx_test", name: "Testish", nativeName: "Testish" } },
      level: { connect: { id: level.id } },
    },
  });

  try {
    // ── New user: empty dashboard ───────────────────────────────────────
    let dash = await getDashboardData("phase15-user");
    assert(!dash.enrolled, "fresh user is not enrolled");
    assert(dash.enrolled === false && dash.hasEnrollments === false, "fresh user has no enrollments");

    // ── Enroll in Spanish A1 ────────────────────────────────────────────
    const enroll = await startLanguageForUser("phase15-user", "es", "A1");
    assert(enroll.ok, "spanish enrollment ok");

    const course = await getPublishedCourse("es", "A1");
    assert(course, "published A1 course exists");
    const allLessons = course.modules.flatMap((m) => m.lessons);
    assert(allLessons.length > 0, "course has lessons");
    const lesson1 = allLessons[0]!;

    dash = await getDashboardData("phase15-user");
    assert(dash.enrolled, "enrolled dashboard");
    if (dash.enrolled) {
      assert(dash.languageCode === "es", `languageCode es, got ${dash.languageCode}`);
      assert(dash.levelCode === "A1", `levelCode A1, got ${dash.levelCode}`);
      assert(dash.lessonsCompleted === 0, "zero lessons completed");
      assert(dash.lessonsTotal === allLessons.length, `lessonsTotal ${allLessons.length}, got ${dash.lessonsTotal}`);
      assert(dash.lessonPct === 0, "0% course progress");
      assert(dash.fourSkills.every((s) => s.total > 0), "four skills carry totals");
      assert(dash.fourSkills.length > 0, "four skills populated");
      assert(dash.wordsLearned === 0, "no words learned yet");
      assert(dash.accuracy === null, "no accuracy yet");
      assert(dash.continueAction.kind === "lesson", "continue action is a lesson (no due cards)");
      if (dash.continueAction.kind === "lesson") {
        assert(dash.continueAction.lesson.id === lesson1.id, "first continue is lesson 1");
      }
      assert(dash.dailyGoal.today === 0 && dash.dailyGoal.target === 50 && !dash.dailyGoal.complete, "daily goal 0/50, incomplete");
      assert(dash.gamification.totalXp === 0, "fresh gamification 0 XP");
      assert(dash.recentActivity.length === 0, "no recent activity");
      assert(dash.additionalLanguages.length === 0, "no additional languages yet");
    }

    // ── Recent activity + today's XP via XpEvent rows ──────────────────
    await db.xpEvent.createMany({
      data: [
        { userId: "phase15-user", amount: 5, reason: "FLASHCARD", refType: "FLASHCARD", refId: "p15-f1", createdAt: NOW },
        { userId: "phase15-user", amount: 10, reason: "EXERCISE", refType: "EXERCISE", refId: "p15-e1", createdAt: NOW },
      ],
    });

    dash = await getDashboardData("phase15-user");
    assert(dash.enrolled && dash.dailyGoal.today === 15, `today XP 15, got ${dash.enrolled ? dash.dailyGoal.today : "n/a"}`);
    assert(dash.enrolled && dash.recentActivity.length === 2, `recent activity 2, got ${dash.enrolled ? dash.recentActivity.length : "n/a"}`);
    if (dash.enrolled) {
      const first = dash.recentActivity[0]!;
      assert(first.amount === 10 || first.amount === 5, "activity amounts present");
    }

    // ── First lesson completion advances continue action ───────────────
    const done = await completeLesson("phase15-user", lesson1.id);
    assert(done.ok, "complete lesson 1 ok");

    dash = await getDashboardData("phase15-user");
    if (dash.enrolled) {
      assert(dash.lessonsCompleted === 1, "one lesson completed");
      const expPct = Math.round((1 / allLessons.length) * 100);
      assert(dash.lessonPct === expPct, `lessonPct ${expPct}, got ${dash.lessonPct}`);
      if (allLessons.length > 1) {
        assert(dash.continueAction.kind === "lesson", "continue is still a lesson (no due cards)");
        if (dash.continueAction.kind === "lesson") {
          assert(dash.continueAction.lesson.id === allLessons[1]!.id, "continue advances to lesson 2");
        }
      }
    }

    // ── Due card flips the continue action to review ───────────────────
    const card = await db.flashcard.findFirst({
      where: { lessonId: lesson1.id, status: "PUBLISHED" },
    });
    assert(card, "lesson 1 has a published flashcard");
    await db.flashcardProgress.upsert({
      where: { userId_flashcardId: { userId: "phase15-user", flashcardId: card!.id } },
      update: { state: "REVIEW", dueAt: new Date(NOW.getTime() - 3600_000), lastReviewedAt: new Date(NOW.getTime() - 3600_000), lastRating: "GOOD" },
      create: { userId: "phase15-user", flashcardId: card!.id, state: "REVIEW", dueAt: new Date(NOW.getTime() - 3600_000), lastReviewedAt: new Date(NOW.getTime() - 3600_000), lastRating: "GOOD" },
    });

    dash = await getDashboardData("phase15-user");
    assert(dash.enrolled && dash.continueAction.kind === "review", "continue flips to review when cards are due");
    if (dash.enrolled && dash.continueAction.kind === "review") {
      assert(dash.continueAction.count >= 1, `review count >= 1, got ${dash.continueAction.count}`);
    }

    // ── Additional languages + switching ────────────────────────────────
    const enrollFake = await startLanguageForUser("phase15-user", "xx_test", "A1");
    assert(enrollFake.ok, "fake language enrollment ok");
    const reactivate = await startLanguageForUser("phase15-user", "es", "A1");
    assert(reactivate.ok, "reactivate spanish ok");

    const fakeRow = await db.userLanguage.findFirstOrThrow({
      where: { userId: "phase15-user", language: { code: "xx_test" } },
    });

    dash = await getDashboardData("phase15-user");
    assert(dash.enrolled && dash.languageCode === "es", "spanish is active again");
    if (dash.enrolled) {
      assert(dash.additionalLanguages.length === 1, `one additional language, got ${dash.additionalLanguages.length}`);
      const extra = dash.additionalLanguages[0]!;
      assert(extra.id === fakeRow.id, "additional language is the fake enrollment");
      assert(extra.code === "xx_test", `additional language code, got ${extra.code}`);
      assert(extra.levelCode === "A1", "additional language level A1");
      assert(extra.lessonsTotal === 0 && extra.pct === 0, "additional language has no lessons");
    }

    // Switching to the other language activates it on the dashboard
    const switched = await setActiveEnrollmentForUser("phase15-user", fakeRow.id);
    assert(switched.ok, "switch to fake language ok");
    dash = await getDashboardData("phase15-user");
    assert(dash.enrolled && dash.languageCode === "xx_test", "dashboard now shows the switched language");
    if (dash.enrolled) {
      assert(dash.additionalLanguages.some((l) => l.code === "es"), "spanish now listed under other languages");
      assert(dash.lessonsTotal === 0, "fake course has zero lessons");
      assert(dash.continueAction.kind === "complete", "zero-lesson course reports complete");
    }

    console.log("PHASE 15 VERIFICATION PASSED (dashboard: empty state, tiles, continue action, skills, activity, additional languages, switching)");
  } finally {
    await db.user.deleteMany({ where: { email: EMAIL } });
    await db.course.deleteMany({ where: { id: fakeCourse.id } });
    await db.language.deleteMany({ where: { code: "xx_test" } });
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());