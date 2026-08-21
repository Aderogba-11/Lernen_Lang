import "dotenv/config";
import { db } from "../lib/db";
import {
  setActiveEnrollmentForUser,
  startLanguageForUser,
} from "../lib/enrollments";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function makeUser(id: string, email: string) {
  await db.user.create({
    data: {
      id,
      name: "Phase Three Tester",
      email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function cleanup() {
  await db.user.deleteMany({ where: { email: { contains: "@phase3.local" } } });
  await db.course.deleteMany({ where: { title: { in: ["French A1", "Spanish A2 TEST"] } } });
}

async function main() {
  await cleanup();

  const userA = "phase3-user-a";
  const userB = "phase3-user-b";
  await makeUser(userA, "a@phase3.local");
  await makeUser(userB, "b@phase3.local");

  // 1. Unavailable course rejected (no French A1 yet)
  const fr = await startLanguageForUser(userA, "fr", "A1");
  assert(!fr.ok && fr.error.includes("No French"), `French A1 should be rejected: ${JSON.stringify(fr)}`);

  // 2. Unknown level rejected
  const esC2 = await startLanguageForUser(userA, "es", "C2");
  assert(!esC2.ok, "Spanish C2 should be rejected");

  // 3. Default path works: Spanish A1
  const ok = await startLanguageForUser(userA, "es", "A1");
  assert(ok.ok, `Spanish A1 should succeed: ${JSON.stringify(ok)}`);
  const activeA = await db.userLanguage.findFirst({
    where: { userId: userA, isActive: true },
    include: { language: true, course: { include: { level: true } } },
  });
  assert(activeA?.language.code === "es" && activeA.course?.level.code === "A1", "active enrollment should be Spanish A1");

  // 4. DRAFT course rejected
  const french = await db.language.findUniqueOrThrow({ where: { code: "fr" } });
  const a1 = await db.level.findUniqueOrThrow({ where: { code: "A1" } });
  const draftCourse = await db.course.create({
    data: { languageId: french.id, levelId: a1.id, title: "French A1", status: "DRAFT" },
  });
  const draftAttempt = await startLanguageForUser(userA, "fr", "A1");
  assert(!draftAttempt.ok, "DRAFT French A1 must be rejected");
  await db.course.delete({ where: { id: draftCourse.id } });

  // 5. Second language + single-active swap
  const spanish = await db.language.findUniqueOrThrow({ where: { code: "es" } });
  const a2 = await db.level.findUniqueOrThrow({ where: { code: "A2" } });
  await db.course.create({
    data: { languageId: spanish.id, levelId: a2.id, title: "Spanish A2 TEST", status: "PUBLISHED" },
  });
  await db.course.create({
    data: { languageId: french.id, levelId: a1.id, title: "French A1", status: "PUBLISHED" },
  });

  const second = await startLanguageForUser(userA, "fr", "A1");
  assert(second.ok, "published French A1 should enroll");

  const rows = await db.userLanguage.findMany({ where: { userId: userA } });
  assert(rows.length === 2, `expected 2 enrollments, got ${rows.length}`);
  const actives = rows.filter((r) => r.isActive);
  assert(actives.length === 1 && actives[0].languageId === french.id, "exactly one active, should now be French");

  // 6. Re-picking Spanish at A2 updates the existing row (no duplicate)
  const repick = await startLanguageForUser(userA, "es", "A2");
  assert(repick.ok, "re-pick should upsert");
  const rowsAfterRepick = await db.userLanguage.findMany({ where: { userId: userA } });
  assert(rowsAfterRepick.length === 2, "re-pick must not create duplicates");
  const esRow = rowsAfterRepick.find((r) => r.languageId === spanish.id);
  assert(esRow?.isActive === true && esRow.courseId !== null, "Spanish re-activated with new course");

  // 7. Cross-user ownership rejected
  const foreignRow = await db.userLanguage.findFirstOrThrow({ where: { userId: userA, languageId: french.id } });
  const crossUser = await setActiveEnrollmentForUser(userB, foreignRow.id);
  assert(!crossUser.ok, "user B must not activate user A's enrollment");

  // 8. Own switch works and leaves exactly one active
  const ownSwitch = await setActiveEnrollmentForUser(userA, foreignRow.id);
  assert(ownSwitch.ok, "own switch should work");
  const finalRows = await db.userLanguage.findMany({ where: { userId: userA } });
  const finalActives = finalRows.filter((r) => r.isActive);
  assert(finalActives.length === 1 && finalActives[0].languageId === french.id, "single-active invariant after switch");

  await cleanup();
  console.log("PHASE 3 VERIFICATION PASSED");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
