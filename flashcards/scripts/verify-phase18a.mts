import "dotenv/config";
import { db } from "../lib/db";
import { isAdmin } from "../lib/admin";
import { getAdminCatalogTree, getPublishedCourse } from "../lib/catalog";
import {
  createCourse,
  createLanguage,
  createLevel,
  createModule,
  deleteCourse,
  deleteLanguage,
  deleteLevel,
  deleteModule,
  updateCourse,
  updateLanguage,
  updateLevel,
  updateModule,
} from "../lib/admin-catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const LANG_CODE = "xv";
const LEVEL_CODE = "T9";

async function main() {
  await db.language.deleteMany({ where: { code: LANG_CODE } });
  await db.level.deleteMany({ where: { code: LEVEL_CODE } });

  try {
    // ── LL-166: admin access concept ─────────────────────────────────────
    assert(isAdmin({ role: "ADMIN" }), "ADMIN role is admin");
    assert(!isAdmin({ role: "USER" }), "USER role is not admin");
    assert(!isAdmin({ role: null }), "null role is not admin");
    assert(!isAdmin(null), "no user is not admin");
    assert(!isAdmin({}), "anonymous object is not admin");

    // ── LL-168: manage languages ─────────────────────────────────────────
    const lang = await createLanguage({
      code: LANG_CODE,
      name: "Verificationese",
      nativeName: "Verifikatsiya",
    });
    assert(lang.ok && lang.id, "language created");
    const langId = lang.id!;

    const dupLang = await createLanguage({
      code: LANG_CODE,
      name: "Duplicate",
      nativeName: "Dup",
    });
    assert(!dupLang.ok, "duplicate language code rejected");

    const updLang = await updateLanguage(langId, {
      code: LANG_CODE,
      name: "Verificationese v2",
      nativeName: "Verifikatsiya v2",
      isActive: true,
    });
    assert(updLang.ok, "language updated");
    const langRow = await db.language.findUnique({ where: { id: langId } });
    assert(langRow?.name === "Verificationese v2", "language name persisted");

    // ── LL-169: manage levels ────────────────────────────────────────────
    const maxOrder = (
      await db.level.aggregate({ _max: { order: true } })
    )._max.order ?? 0;
    const level = await createLevel({
      code: LEVEL_CODE,
      name: "Verification Tier",
      order: maxOrder + 1,
    });
    assert(level.ok && level.id, "level created");
    const levelId = level.id!;

    const updLevel = await updateLevel(levelId, {
      code: LEVEL_CODE,
      name: "Verification Tier v2",
      order: maxOrder + 1,
    });
    assert(updLevel.ok, "level updated");

    // ── LL-170: manage courses + publish toggle ──────────────────────────
    const course = await createCourse({
      title: "Verification Course",
      description: "temp",
      languageId: langId,
      levelId,
      status: "DRAFT",
    });
    assert(course.ok && course.id, "course created");
    const courseId = course.id!;

    const dupCourse = await createCourse({
      title: "Dup",
      description: null,
      languageId: langId,
      levelId,
      status: "DRAFT",
    });
    assert(!dupCourse.ok, "duplicate (language, level) course rejected");

    let published = await getPublishedCourse(LANG_CODE, LEVEL_CODE);
    assert(published === null, "draft course is not published yet");

    const publish = await updateCourse(courseId, {
      title: "Verification Course",
      description: "temp",
      languageId: langId,
      levelId,
      status: "PUBLISHED",
    });
    assert(publish.ok, "course published");
    published = await getPublishedCourse(LANG_CODE, LEVEL_CODE);
    assert(published?.id === courseId, "published course appears in catalogue");

    const unpublish = await updateCourse(courseId, {
      title: "Verification Course",
      description: "temp",
      languageId: langId,
      levelId,
      status: "DRAFT",
    });
    assert(unpublish.ok, "course unpublished");
    published = await getPublishedCourse(LANG_CODE, LEVEL_CODE);
    assert(published === null, "unpublished course hidden from learners");

    // ── LL-171: manage modules ───────────────────────────────────────────
    const module_ = await createModule({
      title: "Verification Module",
      description: null,
      courseId,
      order: 1,
    });
    assert(module_.ok && module_.id, "module created");
    const moduleId = module_.id!;

    const dupModule = await createModule({
      title: "Dup",
      description: null,
      courseId,
      order: 1,
    });
    assert(!dupModule.ok, "duplicate module order rejected within a course");

    const updModule = await updateModule(moduleId, {
      title: "Verification Module v2",
      description: "updated",
      order: 1,
    });
    assert(updModule.ok, "module updated");

    // ── Delete guards ────────────────────────────────────────────────────
    const delLangBlocked = await deleteLanguage(langId);
    assert(!delLangBlocked.ok, "language with courses cannot be deleted");

    const delLevelBlocked = await deleteLevel(levelId);
    assert(!delLevelBlocked.ok, "level with courses cannot be deleted");

    const delCourseBlocked = await deleteCourse(courseId);
    assert(!delCourseBlocked.ok, "course with modules cannot be deleted");

    // learner attachment blocks course deletion
    const learner = await db.user.create({
      data: {
        id: "phase18a-learner",
        name: "Learner",
        email: "phase18a-learner@test.local",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await db.userLanguage.create({
      data: {
        userId: learner.id,
        languageId: langId,
        courseId,
      },
    });
    const delCourseEnrolled = await deleteCourse(courseId);
    assert(!delCourseEnrolled.ok, "course with learners cannot be deleted");
    await db.user.deleteMany({ where: { id: learner.id } });

    // ── LL-167: catalogue tree shows the new entities ────────────────────
    const tree = await getAdminCatalogTree();
    const treeLang = tree.find((l) => l.code === LANG_CODE);
    assert(treeLang, "tree includes the new language");
    const treeCourse = treeLang?.courses.find((c) => c.id === courseId);
    assert(treeCourse, "tree includes the new course");
    assert(
      treeCourse?.modules.some((m) => m.id === moduleId),
      "tree includes the new module",
    );

    // ── Sanity: seeded Spanish A1 course still intact ────────────────────
    const spanish = await getPublishedCourse("es", "A1");
    assert(spanish, "seeded Spanish A1 course still published");

    // ── Cleanup in dependency order ──────────────────────────────────────
    const delModuleOk = await deleteModule(moduleId);
    assert(delModuleOk.ok, "module deleted");
    const delCourseOk = await deleteCourse(courseId);
    assert(delCourseOk.ok, "course deleted after module removed");
    const delLevelOk = await deleteLevel(levelId);
    assert(delLevelOk.ok, "level deleted");
    const delLangOk = await deleteLanguage(langId);
    assert(delLangOk.ok, "language deleted");

    console.log("verify-phase18a: ALL CHECKS PASSED");
  } finally {
    await db.language.deleteMany({ where: { code: LANG_CODE } });
    await db.level.deleteMany({ where: { code: LEVEL_CODE } });
    await db.user.deleteMany({ where: { id: "phase18a-learner" } });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});