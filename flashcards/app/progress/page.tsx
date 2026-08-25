import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getLearnerStats } from "@/lib/stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Progress — Lernen Lang" };

const SKILL_LABELS: Record<string, string> = {
  WRITING: "Writing",
  READING: "Reading",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {sub && (
        <CardContent className="text-sm text-zinc-500">{sub}</CardContent>
      )}
    </Card>
  );
}

export default async function ProgressPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const stats = await getLearnerStats(user.id);

  if (!stats.enrolled) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No active course</CardTitle>
            <CardDescription>
              Pick a language to start tracking progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/languages">Choose a language</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const maxActivity = Math.max(1, ...stats.activity.map((d) => d.count));
  const lessonPct =
    stats.lessonsTotal === 0
      ? 0
      : Math.round((stats.lessonsCompleted / stats.lessonsTotal) * 100);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
          <p className="text-sm text-zinc-500">
            {stats.languageName} · {stats.courseTitle}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/learn">Back to course</Link>
        </Button>
      </div>

      <div className="flex w-full max-w-4xl items-center justify-between gap-4">
        {stats.dueNow > 0 && (
          <Button asChild>
            <Link href="/review">Review {stats.dueNow} card{stats.dueNow === 1 ? "" : "s"}</Link>
          </Button>
        )}
        <p className="text-sm text-zinc-500">
          {stats.reviewsToday} card review{stats.reviewsToday === 1 ? "" : "s"} today
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Lessons completed"
          value={`${stats.lessonsCompleted}/${stats.lessonsTotal}`}
          sub={`${lessonPct}% of the course`}
        />
        <Tile
          label="Cards reviewed"
          value={String(stats.cardsTouched)}
          sub="unique flashcards"
        />
        <Tile
          label="Cards in rotation"
          value={String(stats.cardsInRotation)}
          sub="scheduled for review"
        />
        <Tile
          label="Exercise attempts"
          value={String(stats.attemptsTotal)}
          sub="all time"
        />
      </div>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Exercise attempts per day (14 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-end gap-1.5">
            {stats.activity.map((day) => (
              <div
                key={day.date}
                className="group relative flex h-full flex-1 items-end"
                title={`${day.date}: ${day.count}`}
              >
                <div
                  className="w-full rounded-t bg-zinc-900 transition-colors group-hover:bg-zinc-700 dark:bg-zinc-100 dark:group-hover:bg-zinc-300"
                  style={{ height: `${Math.max((day.count / maxActivity) * 100, day.count > 0 ? 8 : 2)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>13 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>
            Lessons and exercise mastery per module
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {stats.modules.map((mod) => (
            <div
              key={mod.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">
                  {mod.order}. {mod.title}
                </span>
                <Badge variant="secondary">
                  {mod.lessonsCompleted}/{mod.lessonsTotal} lessons
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {mod.skills.map((skill) => (
                  <Badge
                    key={skill.skill}
                    variant={skill.passed === skill.total ? "default" : "outline"}
                  >
                    {SKILL_LABELS[skill.skill] ?? skill.skill}:{" "}
                    {skill.passed}/{skill.total}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                  style={{
                    width:
                      mod.lessonsTotal === 0
                        ? "0%"
                        : `${(mod.lessonsCompleted / mod.lessonsTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Recent attempts</CardTitle>
          <CardDescription>Your last 10 submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No exercise attempts yet — complete a lesson to see results here.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {stats.recent.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={attempt.passed ? "default" : "destructive"}
                    >
                      {attempt.passed ? "Passed" : "Failed"}
                    </Badge>
                    <span className="font-medium">
                      {SKILL_LABELS[attempt.skill] ?? attempt.skill}
                    </span>
                    <span className="text-zinc-500">
                      {attempt.lessonTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-500">
                    {attempt.correct !== null && attempt.total !== null && (
                      <span>
                        {attempt.correct}/{attempt.total}
                      </span>
                    )}
                    <span>{formatDate(attempt.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
