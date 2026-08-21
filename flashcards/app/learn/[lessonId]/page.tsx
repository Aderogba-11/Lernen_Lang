import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getSessionContent } from "@/lib/sessions";
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
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lesson unavailable</CardTitle>
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

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {session.lessonTitle}
        </h1>
        {session.objective && (
          <p className="text-sm text-zinc-500">{session.objective}</p>
        )}
      </div>
      <SessionClient session={session} />
    </main>
  );
}
