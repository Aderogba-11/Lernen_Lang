import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getSessionContent } from "@/lib/sessions";
import { getNextLesson } from "@/lib/course";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionClient } from "./session-client";

export const metadata = { title: "Lesson — Lernen Lang" };

export default async function LessonSessionPage({
  params,
}: PageProps<"/learn/[lessonId]">) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { lessonId } = await params;
  const session = await getSessionContent(user.id, lessonId);

  if ("error" in session) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
        <Card className="w-full max-w-md animate-card-in">
          <CardHeader>
            <CardTitle className="text-xl">Lesson unavailable</CardTitle>
            <CardDescription>{session.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/learn">Back to course</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const nextLesson = await getNextLesson(user.id, lessonId);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-md flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {session.lessonTitle}
        </h1>
        {session.objective && (
          <p className="text-sm text-muted-foreground">{session.objective}</p>
        )}
      </div>
      <SessionClient session={session} nextLesson={nextLesson} />
    </main>
  );
}
