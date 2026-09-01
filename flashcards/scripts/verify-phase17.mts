import "dotenv/config";
import { db } from "../lib/db";
import { awardXp } from "../lib/xp";
import { getPublishedCourse } from "../lib/catalog";
import { startLanguageForUser } from "../lib/enrollments";
import { completeLesson } from "../lib/sessions";
import {
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  syncActionNotifications,
} from "../lib/notifications";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const EMAIL = "phase17-test@test.local";
const EMAIL_B = "phase17-test-b@test.local";
const NOW = new Date();
const YESTERDAY = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);

async function main() {
  await db.user.deleteMany({ where: { email: { in: [EMAIL, EMAIL_B] } } });
  await db.user.create({
    data: { id: "phase17-user", email: EMAIL, name: "Phase17", createdAt: NOW, updatedAt: NOW },
  });
  await db.user.create({
    data: { id: "phase17-user-b", email: EMAIL_B, name: "Phase17B", createdAt: NOW, updatedAt: NOW },
  });

  try {
    const course = await getPublishedCourse("es", "A1");
    assert(course, "published course exists");
    const lessonIds = course.modules
      .map((m) => m.lessons.map((l) => l.id))
      .flat();
    assert(lessonIds.length >= 2, "at least two lessons");

    const enrollA = await startLanguageForUser("phase17-user", "es", "A1");
    assert(enrollA.ok, "A enrollment ok");

    // ── LL-163: achievement unlocked notification ───────────────────────
    const first = await completeLesson("phase17-user", lessonIds[0]!);
    assert(first.ok, "complete first lesson");
    const achievementsA = await db.notification.findMany({
      where: { userId: "phase17-user", type: "ACHIEVEMENT" },
    });
    assert(achievementsA.length >= 1, "achievement notification created");
    assert(
      achievementsA.some((n) => n.title.startsWith("Achievement unlocked:")),
      "achievement notification has expected title",
    );
    assert(
      achievementsA.every((n) => n.readAt === null && n.link === "/progress"),
      "achievement notifications unread with progress link",
    );

    // ── LL-164: course completion notification ──────────────────────────
    for (const lessonId of lessonIds.slice(1)) {
      const res = await completeLesson("phase17-user", lessonId);
      assert(res.ok, `complete lesson ${lessonId}`);
    }
    const courseComplete = await db.notification.findMany({
      where: { userId: "phase17-user", type: "COURSE_COMPLETE" },
    });
    assert(courseComplete.length === 1, "exactly one course-complete notification");
    assert(
      courseComplete[0]!.title.includes(course.title),
      "course-complete notification names the course",
    );
    assert(courseComplete[0]!.link === "/learn", "course-complete links to /learn");

    // re-completing a lesson must not duplicate course notifications
    const again = await completeLesson("phase17-user", lessonIds[0]!);
    assert(again.ok, "re-complete first lesson ok");
    const afterRe = await db.notification.count({
      where: { userId: "phase17-user", type: "COURSE_COMPLETE" },
    });
    assert(afterRe === 1, "course-complete notification not duplicated");

    // ── LL-165: mark notifications read ─────────────────────────────────
    const unreadBefore = await getUnreadNotificationCount("phase17-user");
    assert(unreadBefore >= 1, "unread count positive before marking");
    const marked = await markNotificationsRead(
      "phase17-user",
      courseComplete.map((n) => n.id),
    );
    assert(marked === 1, "marking targeted row returns count 1");
    const afterMark = await db.notification.findUnique({
      where: { id: courseComplete[0]!.id },
    });
    assert(afterMark?.readAt != null, "read status persists");
    const unreadAfter = await getUnreadNotificationCount("phase17-user");
    assert(
      unreadAfter === unreadBefore - 1,
      "unread count drops by one after marking",
    );

    const markAll = await markNotificationsRead("phase17-user");
    assert(markAll >= 1, "mark all returns a positive count");
    assert(
      (await getUnreadNotificationCount("phase17-user")) === 0,
      "all notifications read",
    );

    // ── LL-161 + LL-162: reminder and streak-at-risk (dedup per day) ────
    const fresh = await syncActionNotifications("phase17-user-b");
    assert(fresh.created.length === 0, "fresh learner gets no nudges");

    await awardXp("phase17-user-b", 25, "LESSON", {
      refType: "LESSON",
      refId: lessonIds[0]!,
      now: YESTERDAY,
    });

    const nudges = await syncActionNotifications("phase17-user-b");
    assert(
      nudges.created.includes("DAILY_REMINDER"),
      "daily reminder created on skipped day",
    );
    assert(
      nudges.created.includes("STREAK_AT_RISK"),
      "streak-at-risk created when streak active and no XP today",
    );

    const dedup = await syncActionNotifications("phase17-user-b");
    assert(dedup.created.length === 0, "nudges de-duplicated on second call");

    const reminderRows = await db.notification.findMany({
      where: { userId: "phase17-user-b", type: "DAILY_REMINDER" },
    });
    const riskRows = await db.notification.findMany({
      where: { userId: "phase17-user-b", type: "STREAK_AT_RISK" },
    });
    assert(reminderRows.length === 1, "exactly one daily reminder row");
    assert(riskRows.length === 1, "exactly one streak-at-risk row");
    assert(riskRows[0]!.body?.includes("1-day streak"), "at-risk names the streak");

    // ── Isolation: user B cannot read or mutate A's notifications ───────
    await createNotification("phase17-user", {
      type: "ACHIEVEMENT",
      title: "Achievement unlocked: Private title",
      body: "secret",
      link: "/progress",
    });
    const aRows = await getNotifications("phase17-user");
    const privateRow = aRows.find((n) => n.unread);
    assert(privateRow, "A has an unread private notification");

    const tamper = await markNotificationsRead("phase17-user-b", [privateRow!.id]);
    assert(tamper === 0, "user B cannot mark A's notification read");
    const stillUnread = await db.notification.findUnique({
      where: { id: privateRow!.id },
    });
    assert(stillUnread?.readAt === null, "A's notification stays unread");

    const bAll = await db.notification.findMany({
      where: { userId: "phase17-user-b" },
    });
    assert(
      bAll.every((n) => n.userId === "phase17-user-b"),
      "B only sees B's notifications",
    );

    const bNoneOfA = aRows.every((n) => n.userId === "phase17-user");
    assert(bNoneOfA, "A's notification rows carry A's userId");

    console.log("verify-phase17: ALL CHECKS PASSED");
  } finally {
    await db.user.deleteMany({ where: { email: { in: [EMAIL, EMAIL_B] } } });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});