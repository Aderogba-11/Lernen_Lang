import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { AdminField } from "@/components/admin/admin-form";
import { AdminForm } from "@/components/admin/admin-form";
import {
  createFlashcard,
  deleteFlashcard,
  updateFlashcard,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Flashcard — Admin" };

export default async function FlashcardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lessonId?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const card = isNew
    ? null
    : await db.flashcard.findUnique({
        where: { id: params.id },
        include: { lesson: { include: { module: { include: { course: true } } } } },
      });
  if (!isNew && !card) redirect("/admin");

  const lesson = isNew
    ? await db.lesson.findUnique({
        where: { id: searchParams.lessonId },
        include: { module: { include: { course: true } } },
      })
    : card!.lesson;

  const fields: AdminField[] = [
    {
      name: "targetText",
      label: "Target text",
      value: card?.targetText,
      placeholder: "e.g. hola",
      required: true,
    },
    {
      name: "translation",
      label: "Translation",
      value: card?.translation,
      placeholder: "e.g. hello",
      required: true,
    },
    {
      name: "pronunciation",
      label: "Pronunciation",
      value: card?.pronunciation,
      placeholder: "e.g. OH-lah",
    },
    {
      name: "exampleSentence",
      label: "Example sentence",
      type: "textarea",
      value: card?.exampleSentence,
    },
    {
      name: "exampleTranslation",
      label: "Example translation",
      type: "textarea",
      value: card?.exampleTranslation,
    },
    {
      name: "partOfSpeech",
      label: "Part of speech",
      value: card?.partOfSpeech,
      placeholder: "e.g. noun, verb, phrase",
    },
    {
      name: "audioUrl",
      label: "Audio URL",
      value: card?.audioUrl,
      placeholder: "/audio/es/example.mp3",
    },
    {
      name: "imageUrl",
      label: "Image URL",
      value: card?.imageUrl,
      placeholder: "/images/example.png",
    },
    {
      name: "topic",
      label: "Topic",
      value: card?.topic,
      placeholder: "e.g. Greetings",
    },
    {
      name: "difficulty",
      label: "Difficulty",
      type: "number",
      value: card?.difficulty,
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      value: card?.order,
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      value: card?.status ?? "DRAFT",
      options: [
        { label: "Draft", value: "DRAFT" },
        { label: "Published", value: "PUBLISHED" },
      ],
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "New flashcard" : card!.targetText}
          </h1>
          <p className="text-sm text-zinc-500">
            {lesson ? `Lesson: ${lesson.title}` : "Flashcard"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={lesson ? `/admin/lessons/${lesson.id}` : "/admin"}>
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminForm
              fields={fields}
              action={(d) =>
                isNew
                  ? createFlashcard({ ...d, lessonId: searchParams.lessonId })
                  : updateFlashcard(params.id, d)
              }
              successRedirect={isNew ? "/admin" : undefined}
              deleteAction={isNew ? undefined : deleteFlashcard}
              deleteId={isNew ? undefined : params.id}
              deleteRedirect={lesson ? `/admin/lessons/${lesson.id}` : "/admin"}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}