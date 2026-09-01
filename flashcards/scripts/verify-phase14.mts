import "dotenv/config";
import { db } from "../lib/db";
import { updateStreak, daysBetween, addDays } from "../lib/streak";
import { levelProgress } from "../lib/level";
import {
  awardXp,
  ensureGamification,
  XP_FLASHCARD,
  XP_EXERCISE,
  XP_LESSON,
  XP_DAILY_GOAL,
  DAILY_GOAL_XP,
} from "../lib/xp";
import { evaluateAchievements } from "../lib/achievements";
import { getGamificationSummary } from "../lib/gamification";
import { completeLesson, scoreLessonWriting } from "../lib/sessions";
import { startLanguageForUser } from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase14-test@test.local";
const EMAIL_B = "phase14-test-b@test.local";
const NOW = new Date();

async function main() {
  // ── Pure streak math ──────────────────────────────────────────────────
  const d0 = new Date("2026-08-10T12:00:00Z");

  const s = updateStreak({ currentStreak: 0, longestStreak: 0, lastActivityDate: null }, d0);
  assert(s.currentStreak === 1, `first activity streak 1, got ${s.currentStreak}`);
  assert(s.longestStreak === 1, `first activity longest 1, got ${s.longestStreak}`);

  const same = updateStreak({ currentStreak: 1, longestStreak: 1, lastActivityDate: d0 }, new Date(d0.getTime() + 3600_000));
  assert(same.currentStreak === 1, `same-day streak stays 1, got ${same.currentStreak}`);
  assert(same.longestStreak === 1, `same-day longest stays 1`);

  const next = updateStreak({ currentStreak: 1, longestStreak: 1, lastActivityDate: d0 }, addDays(d0, 1));
  assert(next.currentStreak === 2, `extend streak 2, got ${next.currentStreak}`);
  assert(next.longestStreak === 2, `extend longest 2`);

  const reset = updateStreak({ currentStreak: 2, longestStreak: 2, lastActivityDate: addDays(d0, 1) }, addDays(d0, 3));
  assert(reset.currentStreak === 1, `gap>1 resets to 1, got ${reset.currentStreak}`);
  assert(reset.longestStreak === 2, `gap>1 retains longest 2, got ${reset.longestStreak}`);

  const grow = updateStreak({ currentStreak: 5, longestStreak: 6, lastActivityDate: addDays(d0, 5) }, addDays(d0, 6));
  assert(grow.currentStreak === 6, `grow streak 6, got ${grow.currentStreak}`);
  assert(grow.longestStreak === 6, `longest stays 6 (max)`);
  assert(grow.currentStreak === 6, `grow streak 6, got ${grow.currentStreak}`);
  assert(grow.longestStreak === 6, `longest stays 6 (max)`);

  assert(daysBetween(new Date("2026-08-10T00:00:00Z"), new Date("2026-08-11T00:00:00Z")) === 1, "daysBetween 1");

  // ── Level math ────────────────────────────────────────────────────────
  assert(levelProgress(0).level === 1, "0 XP → level 1");
  assert(levelProgress(99).level === 1, "99 XP → level 1");
  assert(levelProgress(100).level === 2, "100 XP → level 2");
  assert(levelProgress(500).level === 6, "500 XP → level 6");
  const lp = levelProgress(150);
  assert(lp.xpIntoLevel === 50 && lp.xpToNext === 50, `level 2 progress 50/50, got ${lp.xpIntoLevel}/${lp.xpToNext}`);

  // ── DB integration ────────────────────────────────────────────────────
  await db.user.deleteMany({ where: { email: { in: [EMAIL, EMAIL_B] } } });
  const user = await db.user.create({
    data: { id: "phase14-user", email: EMAIL, name: "Phase14", createdAt: NOW, updatedAt: NOW },
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

  const writing = await db.exercise.findFirstOrThrow({
    where: { lessonId: lesson1.id, type: "WRITING", status: "PUBLISHED" },
  });
  const answer = writing.answer as { expected?: string; accept?: string[] } | null;
  assert(answer && typeof answer.expected === "string", "writing exercise has expected answer");

  try {
    const enroll = await startLanguageForUser("phase14-user", "es", "A1");
    assert(enroll.ok, "enrollment failed");

    // ── awardXp: amounts & accumulation (below daily goal → no bonus) ───
    await ensureGamification("phase14-user");

    const r1 = await awardXp("phase14-user", XP_FLASHCARD, "FLASHCARD", { refType: "FLASHCARD", refId: "c1" });
    assert(r1.amount === XP_FLASHCARD, `flashcard XP 5, got ${r1.amount}`);
    await awardXp("phase14-user", XP_EXERCISE, "EXERCISE", { refType: "EXERCISE", refId: "e1" });
    await awardXp("phase14-user", XP_LESSON, "LESSON", { refType: "LESSON", refId: "l1" });

    const gam = await db.userGamification.findUniqueOrThrow({ where: { userId: "phase14-user" } });
    // 5 + 10 + 25 = 40 (no daily-goal bonus yet: <50)
    assert(gam.totalXp === 40, `totalXp 40, got ${gam.totalXp}`);
    assert(gam.currentStreak === 1, `streak 1 after same-day awards, got ${gam.currentStreak}`);
    assert(r1.level === 1, `level 1 at 5 XP, got ${r1.level}`);

    // ── Exercise XP dedup via real flow (assert on XpEvent rows) ────────
    const pass1 = await scoreLessonWriting("phase14-user", lesson1.id, writing.id, answer.expected!);
    assert(pass1.ok, "writing pass 1 ok");
    const pass2 = await scoreLessonWriting("phase14-user", lesson1.id, writing.id, answer.expected!);
    assert(pass2.ok, "writing pass 2 ok");

    const exerciseEvents = await db.xpEvent.findMany({
      where: { userId: "phase14-user", reason: "EXERCISE", refId: writing.id },
    });
    assert(exerciseEvents.length === 1, `exercise XP event exactly once, got ${exerciseEvents.length}`);
    assert(exerciseEvents[0]!.amount === XP_EXERCISE, `exercise XP amount 10, got ${exerciseEvents[0]!.amount}`);

    // ── Lesson XP dedup via real flow ───────────────────────────────────
    await completeLesson("phase14-user", lesson1.id);
    await completeLesson("phase14-user", lesson1.id);
    const lessonEvents = await db.xpEvent.findMany({
      where: { userId: "phase14-user", reason: "LESSON", refId: lesson1.id },
    });
    assert(lessonEvents.length === 1, `lesson XP event exactly once, got ${lessonEvents.length}`);
    assert(lessonEvents[0]!.amount === XP_LESSON, `lesson XP amount 25, got ${lessonEvents[0]!.amount}`);

    // ── Achievement: FIRST_LESSON awarded, no double-award ──────────────
    const own = await db.userAchievement.count({
      where: { userId: "phase14-user", def: { code: "FIRST_LESSON" } },
    });
    assert(own === 1, `FIRST_LESSON owned exactly once, got ${own}`);
    const la2 = await evaluateAchievements("phase14-user");
    assert(!la2.includes("FIRST_LESSON"), "FIRST_LESSON not re-awarded");
    const own2 = await db.userAchievement.count({
      where: { userId: "phase14-user", def: { code: "FIRST_LESSON" } },
    });
    assert(own2 === 1, `FIRST_LESSON still owned exactly once after re-evaluate, got ${own2}`);

    // ── Daily-goal bonus: reset day state to a clean baseline ───────────
    const todayStart = new Date(NOW);
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    await db.xpEvent.deleteMany({
      where: { userId: "phase14-user", createdAt: { gte: todayStart, lt: tomorrow } },
    });
    await db.userGamification.update({
      where: { userId: "phase14-user" },
      data: { totalXp: 0 },
    });

    // Top up to the 50 XP daily goal with flashcard awards
    const dayBefore = (await db.userGamification.findUniqueOrThrow({ where: { userId: "phase14-user" } })).totalXp; // 0
    let dayTotal = 0;
    let top = 0;
    while (dayTotal < DAILY_GOAL_XP) {
      await awardXp("phase14-user", XP_FLASHCARD, "FLASHCARD", { refType: "FLASHCARD", refId: `top-${top++}` });
      dayTotal += XP_FLASHCARD;
    }
    // The award that crossed the threshold grants the bonus; the crossing
    // award itself (+5) plus two 5-XP rows (=10) means total = 50 + 50 bonus
    const dayAfter = (await db.userGamification.findUniqueOrThrow({ where: { userId: "phase14-user" } })).totalXp;
    assert(dayAfter === dayBefore + DAILY_GOAL_XP + XP_DAILY_GOAL, `daily goal bonus: 50 earned + 50 bonus, got ${dayAfter - dayBefore}`);

    const bonusEvents = await db.xpEvent.count({
      where: { userId: "phase14-user", reason: "DAILY_GOAL" },
    });
    assert(bonusEvents === 1, `exactly one DAILY_GOAL event, got ${bonusEvents}`);

    // Awarding again today must NOT grant a second daily-goal bonus
    await awardXp("phase14-user", XP_FLASHCARD, "FLASHCARD", { refType: "FLASHCARD", refId: "again" });
    const bonusAfterExtra = await db.xpEvent.count({
      where: { userId: "phase14-user", reason: "DAILY_GOAL" },
    });
    assert(bonusAfterExtra === 1, `still one DAILY_GOAL event`);

    // ── Gamification summary ────────────────────────────────────────────
    const summ = await getGamificationSummary("phase14-user");
    assert(summ.achievements.some((a) => a.code === "FIRST_LESSON" && a.earned), "summary marks FIRST_LESSON earned");
    assert(summ.achievements.length >= 9, `all defs present, got ${summ.achievements.length}`);
    assert(summ.totalXp >= DAILY_GOAL_XP + 5, `summary totalXp reflects daily goal, got ${summ.totalXp}`);
    assert(summ.level === levelProgress(summ.totalXp).level, "summary level matches levelProgress");

    // ── Auth isolation ──────────────────────────────────────────────────
    const userB = await db.user.create({
      data: { id: "phase14-user-b", email: EMAIL_B, name: "B", createdAt: NOW, updatedAt: NOW },
    });
    try {
      const bGam = await db.userGamification.findUnique({ where: { userId: userB.id } });
      assert(bGam === null, "user B has no gamification row");
      const bOwn = await db.userAchievement.count({ where: { userId: userB.id } });
      assert(bOwn === 0, "user B owns no achievements");
      const bSumm = await getGamificationSummary(userB.id);
      assert(bSumm.totalXp === 0, "user B totalXp 0");
      assert(!bSumm.achievements.some((a) => a.earned), "user B no earned achievements");
    } finally {
      await db.user.deleteMany({ where: { email: EMAIL_B } });
    }

    console.log("PHASE 14 VERIFICATION PASSED (XP, streaks, levels, achievements, daily goal, auth isolation)");
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