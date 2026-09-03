import { db } from "@/lib/db";

export async function getActiveLanguages() {
  return db.language.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nativeName: true,
    },
  });
}

export async function getPublishedCourse(languageCode: string, levelCode: string) {
  return db.course.findFirst({
    where: {
      status: "PUBLISHED",
      language: { code: languageCode, isActive: true },
      level: { code: levelCode },
    },
    include: {
      language: true,
      level: true,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            include: {
              exercises: {
                where: { status: "PUBLISHED" },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });
}

export type PublishedCourse = NonNullable<
  Awaited<ReturnType<typeof getPublishedCourse>>
>;

export async function getAdminCatalogTree() {
  return db.language.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nativeName: true,
      isActive: true,
      courses: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          level: { select: { id: true, code: true, name: true } },
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              lessons: {
                orderBy: { order: "asc" },
                select: { id: true, title: true, order: true, status: true },
              },
            },
          },
        },
      },
    },
  });
}
