import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getLearnerStats } from "@/lib/stats";
import { getGamificationSummary } from "@/lib/gamification";
import { getCourseNavigation } from "@/lib/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LockIcon } from "lucide-react";
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
  accent = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "reward" | "success";
}) {
  const chip =
    accent === "reward"
      ? "bg-reward/15 text-reward"
      : accent === "success"
        ? "bg-success/15 text-success"
        : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardHeader>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${chip}`}>
          {label.charAt(0)}
        </span>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      {sub && (
        <CardContent className="text-muted-foreground">{sub}</CardContent>
      )}
    </Card>
  );
}

export default async function ProgressPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [stats, gam, nav] = await Promise.all([
    getLearnerStats(user.id),
    getGamificationSummary(user.id),
    getCourseNavigation(user.id),
  ]);

  if (!stats.enrolled) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
        <Card className="w-full max-w-md animate-card-in">
          <CardHeader>
            <CardTitle className="text-xl">No active course</CardTitle>
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

  const navData = nav.enrolled ? nav : null;
  const nextLessonTitle = navData?.nextLessonId
    ? navData.modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === navData.nextLessonId)?.title
    : undefined;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <p className="text-sm text-muted-foreground">
            {stats.languageName} · {stats.courseTitle}
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {stats.dueNow > 0 && (
            <Button asChild>
              <Link href="/review">Review {stats.dueNow} card{stats.dueNow === 1 ? "" : "s"}</Link>
            </Button>
          )}
          {navData?.nextLessonId && (
            <Button asChild>
              <Link href={`/learn/${navData.nextLessonId}`}>
                Continue — {nextLessonTitle}
              </Link>
            </Button>
          )}
          {navData && !navData.nextLessonId && (
            <Button asChild variant="outline">
              <Link href="/learn">Course complete · review</Link>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
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
          accent="success"
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

      <div className="grid w-full max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Total XP"
          value={String(gam.totalXp)}
          sub={`Learner Level ${gam.level}`}
          accent="reward"
        />
        <Tile
          label="Current streak"
          value={`${gam.currentStreak} day${gam.currentStreak === 1 ? "" : "s"}`}
          sub="consecutive study days"
          accent="reward"
        />
        <Tile
          label="Longest streak"
          value={`${gam.longestStreak} day${gam.longestStreak === 1 ? "" : "s"}`}
          sub="best achieved"
        />
        <Card>
          <CardHeader>
            <CardDescription>Level {gam.level} progress</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {gam.xpIntoLevel} / {gam.xpIntoLevel + gam.xpToNext}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Progress
              value={(gam.xpIntoLevel / (gam.xpIntoLevel + gam.xpToNext)) * 100}
              variant="reward"
            />
            <p className="text-xs text-muted-foreground">
              {gam.xpToNext} XP to level {gam.level + 1}
            </p>
          </CardContent>
        </Card>
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
                  className={`w-full rounded-t transition-all ${
                    day.count === 0
                      ? "bg-muted"
                      : "bg-primary hover:bg-primary/80"
                  }`}
                  style={{ height: `${Math.max((day.count / maxActivity) * 100, day.count > 0 ? 8 : 2)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
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
          {navData && navData.modules.length > 0 ? (
            navData.modules.map((m) => {
              const skillStats = stats.modules.find((s) => s.id === m.id);
              return (
            <div
              key={m.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">
                  {m.order}. {m.title}
                </span>
                <Badge variant="secondary">
                  {m.completed}/{m.total} lessons
                </Badge>
              </div>
              {skillStats && skillStats.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skillStats.skills.map((skill) => (
                    <Badge
                      key={skill.skill}
                      variant={skill.passed === skill.total ? "default" : "outline"}
                    >
                      {SKILL_LABELS[skill.skill] ?? skill.skill}:{" "}
                      {skill.passed}/{skill.total}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Progress
                  value={m.total === 0 ? 0 : (m.completed / m.total) * 100}
                />
              </div>
              <ul className="mt-3 flex flex-col gap-1">
                {m.lessons.map((l) =>
                  l.status === "LOCKED" ? (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <LockIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          Lesson {l.order}: {l.title}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Complete earlier lessons first
                      </span>
                    </li>
                  ) : (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${l.id}`}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        <span className="truncate font-medium">
                          Lesson {l.order}: {l.title}
                        </span>
                        <Badge
                          variant={
                            l.status === "COMPLETED"
                              ? "default"
                              : l.status === "IN_PROGRESS"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {l.status === "COMPLETED"
                            ? "✓"
                            : l.status === "IN_PROGRESS"
                              ? "In progress"
                              : "Start"}
                        </Badge>
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete a lesson to see module breakdown.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Milestones you have unlocked while learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gam.achievements.map((a) => (
              <div
                key={a.code}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-4 text-center ${
                  a.earned
                    ? "border-reward/25 bg-reward/10 shadow-sm"
                    : "border-dashed border-border opacity-50"
                }`}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-sm font-medium">{a.title}</span>
                <span className="text-xs text-muted-foreground">
                  {a.description}
                </span>
                {a.earned ? (
                  <Badge className="bg-reward text-reward-foreground">Unlocked</Badge>
                ) : (
                  <Badge variant="secondary">Locked</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Recent attempts</CardTitle>
          <CardDescription>Your last 10 submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exercise attempts yet — complete a lesson to see results here.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
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
                    <span className="text-muted-foreground">
                      {attempt.lessonTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
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
