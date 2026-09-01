import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getDashboardData } from "@/lib/dashboard";
import { syncActionNotifications } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SwitchLanguageButton } from "./switch-language-button";
import { NotificationBell } from "@/components/notification-bell";

export const metadata = { title: "Dashboard — Lernen Lang" };

const SKILL_LABELS: Record<string, string> = {
  WRITING: "Writing",
  READING: "Reading",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
};

const REASON_LABELS: Record<string, string> = {
  FLASHCARD: "Flashcard reviewed",
  EXERCISE: "Exercise passed",
  LESSON: "Lesson completed",
  DAILY_GOAL: "Daily goal bonus",
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
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

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(user.id);

  if (data.enrolled) {
    await syncActionNotifications(user.id);
  }

  if (!data.enrolled) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {data.hasEnrollments
                ? "No active course"
                : "Welcome to Lernen Lang"}
            </CardTitle>
            <CardDescription>
              {data.hasEnrollments
                ? "Pick one of your languages to start learning again."
                : "Choose a language and level to start your learning journey."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/languages">Choose a language</Link>
            </Button>
            {data.hasEnrollments && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/learn">Browse courses</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  const { gamification: gam, dailyGoal } = data;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            {data.languageName}
            {data.nativeName && data.nativeName !== data.languageName
              ? ` (${data.nativeName})`
              : ""}{" "}
            · {data.courseTitle} · Level {data.levelCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button asChild variant="outline">
            <Link href="/learn">Browse courses</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/progress">Progress</Link>
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardDescription>
            {data.continueAction.kind === "review"
              ? "Review time"
              : data.continueAction.kind === "lesson"
                ? `Next up · ${data.continueAction.lesson.moduleTitle}`
                : "Course complete"}
          </CardDescription>
          <CardTitle>
            {data.continueAction.kind === "review"
              ? `${data.continueAction.count} card${data.continueAction.count === 1 ? "" : "s"} due for review`
              : data.continueAction.kind === "lesson"
                ? data.continueAction.lesson.title
                : "You finished the course"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.continueAction.kind === "review" ? (
            <Button asChild className="w-fit">
              <Link href="/review">
                Start review ({data.continueAction.count})
              </Link>
            </Button>
          ) : data.continueAction.kind === "lesson" ? (
            <Button asChild className="w-fit">
              <Link href={`/learn/${data.continueAction.lesson.id}`}>
                Continue
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-fit">
              <Link href="/learn">Review more courses</Link>
            </Button>
          )}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-zinc-500">
                Course progress — {data.lessonsCompleted}/{data.lessonsTotal}{" "}
                lessons
              </span>
              <span className="font-medium">{data.lessonPct}%</span>
            </div>
            <ProgressBar pct={data.lessonPct} />
          </div>
        </CardContent>
      </Card>

      <div className="grid w-full max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="XP"
          value={String(gam.totalXp)}
          sub={`Learner Level ${gam.level}`}
        />
        <Tile
          label="Words learned"
          value={String(data.wordsLearned)}
          sub="unique flashcards reviewed"
        />
        <Tile
          label="Lessons completed"
          value={`${data.lessonsCompleted}/${data.lessonsTotal}`}
        />
        <Tile
          label="Accuracy"
          value={data.accuracy === null ? "—" : `${data.accuracy}%`}
          sub="flashcard ratings"
        />
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Daily goal</CardDescription>
            <CardTitle className="text-3xl">
              {dailyGoal.today} / {dailyGoal.target} XP
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ProgressBar pct={(dailyGoal.today / dailyGoal.target) * 100} />
            <p className="text-sm text-zinc-500">
              {dailyGoal.complete
                ? `Goal reached — ${gam.currentStreak} day streak!`
                : `${dailyGoal.target - dailyGoal.today} XP to today's goal`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-3xl">
              {gam.currentStreak} day{gam.currentStreak === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Longest streak: {gam.longestStreak} day
            {gam.longestStreak === 1 ? "" : "s"} ·{" "}
            {gam.xpToNext} XP to level {gam.level + 1}
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Your skills</CardTitle>
          <CardDescription>Exercise mastery across the four skills</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.fourSkills.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Complete an exercise lesson to see your skill breakdown.
            </p>
          ) : (
            data.fourSkills.map((s) => {
              const pct = s.total === 0 ? 0 : Math.round((s.passed / s.total) * 100);
              return (
                <div key={s.skill}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {SKILL_LABELS[s.skill] ?? s.skill}
                    </span>
                    <span className="text-zinc-500">
                      {s.passed}/{s.total} exercises
                    </span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Your latest XP earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No activity yet — complete a lesson or review a card to earn XP.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {data.recentActivity.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      +{event.amount} XP
                    </Badge>
                    <span className="font-medium">
                      {REASON_LABELS[event.reason] ?? event.reason}
                    </span>
                  </div>
                  <span className="text-zinc-500">
                    {formatTime(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {data.additionalLanguages.length > 0 && (
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Other languages</CardTitle>
            <CardDescription>
              Your other courses — switch anytime, progress is kept.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.additionalLanguages.map((lang) => (
              <div
                key={lang.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium">
                    {lang.name}
                    {lang.nativeName && lang.nativeName !== lang.name
                      ? ` (${lang.nativeName})`
                      : ""}
                  </span>
                  <span className="text-sm text-zinc-500">
                    Level {lang.levelCode} · {lang.lessonsCompleted}/
                    {lang.lessonsTotal} lessons · {lang.pct}%
                  </span>
                </div>
                <SwitchLanguageButton enrollmentId={lang.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}