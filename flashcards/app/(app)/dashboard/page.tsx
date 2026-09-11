import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getDashboardData } from "@/lib/dashboard";
import { syncActionNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  FlameIcon,
  PlayIcon,
  SparklesIcon,
  TargetIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SwitchLanguageButton } from "./switch-language-button";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Dashboard — Lernen Lang" };

const SKILL_LABELS: Record<string, string> = {
  WRITING: "Writing",
  READING: "Reading",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
};

const SKILL_ICONS: Record<string, typeof BookOpenIcon> = {
  WRITING: SparklesIcon,
  READING: BookOpenIcon,
  LISTENING: TargetIcon,
  SPEAKING: ZapIcon,
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

function welcomeMessage(name: string, streak: number): string {
  if (streak === 0) {
    return `Ready to learn something new, ${name}? Start today and build a streak.`;
  }
  if (streak === 1) {
    return `Streak started, ${name}! Come back tomorrow to keep it alive.`;
  }
  if (streak < 5) {
    return `Nice work, ${name} — you're on a ${streak}-day roll. Keep it going!`;
  }
  return `${streak} days in a row, ${name}. You're unstoppable!`;
}

function ProgressRing({
  pct,
  size = 104,
  label,
  sub,
}: {
  pct: number;
  size?: number;
  label: string;
  sub: string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-all duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tracking-tight">{label}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {sub}
        </span>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
}: {
  icon: typeof BookOpenIcon;
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
      <CardHeader className="gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${chip}`}
        >
          <Icon className="h-4.5 w-4.5" />
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
      <main className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
        <Card className="w-full max-w-md animate-card-in">
          <CardHeader>
            <CardTitle className="text-xl">
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
        <SignOutButton />
        {isAdmin(user) && (
          <Link
            href="/admin"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </main>
    );
  }

  const { gamification: gam, dailyGoal } = data;
  const goalPct = Math.round((dailyGoal.today / dailyGoal.target) * 100);
  const levelPct = Math.round(
    (gam.xpIntoLevel / (gam.xpIntoLevel + gam.xpToNext)) * 100,
  );
  const continueLabel =
    data.continueAction.kind === "review"
      ? "Continue"
      : data.continueAction.kind === "lesson"
        ? "Continue Learning"
        : "You finished the course";

  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <section className="w-full">
          <Card className="relative w-full overflow-hidden border-none ring-1 ring-primary/20">
            <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-reward/15 blur-2xl" />
            <CardContent className="relative flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-primary">
                    Welcome back
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {user.name?.trim() || "Learner"}
                  </h1>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    {welcomeMessage(user.name?.trim() || "you", gam.currentStreak)}
                  </p>
                </div>
                {gam.currentStreak > 0 && (
                  <div className="flex items-center gap-2 self-start rounded-full bg-reward/15 px-4 py-2 text-sm font-semibold text-reward ring-1 ring-reward/25">
                    <FlameIcon className="h-4.5 w-4.5 animate-streak-pulse" />
                    {gam.currentStreak}-day streak
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {data.languageName}
                {data.nativeName && data.nativeName !== data.languageName
                  ? ` (${data.nativeName})`
                  : ""}{" "}
                · {data.courseTitle} · Level {data.levelCode}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="animate-card-in">
            <CardContent className="flex items-center gap-5 p-6">
              <ProgressRing
                pct={dailyGoal.complete ? 100 : goalPct}
                label={`${dailyGoal.today}`}
                sub={`/ ${dailyGoal.target} XP`}
              />
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <TargetIcon className="h-4 w-4 text-primary" />
                  Daily goal
                </span>
                <p className="text-sm text-muted-foreground">
                  {dailyGoal.complete
                    ? "Goal reached — bonus XP earned! 🎉"
                    : `${dailyGoal.target - dailyGoal.today} XP to go.`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-card-in">
            <CardHeader>
              <span className="flex h-9 w-9 items-center justify-center gap-1 rounded-lg bg-reward/15 text-reward">
                <ZapIcon className="h-4.5 w-4.5" />
              </span>
              <CardDescription>Total XP</CardDescription>
              <CardTitle className="flex items-baseline gap-2 text-3xl tracking-tight">
                {gam.totalXp}
                <span className="text-sm font-medium text-muted-foreground">
                  Learner Level {gam.level}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <Progress value={levelPct} variant="reward" />
              <p className="text-xs text-muted-foreground">
                {gam.xpToNext} XP to level {gam.level + 1}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-card-in">
            <CardHeader>
              <span className="flex h-9 w-9 items-center justify-center gap-1 rounded-lg bg-success/15 text-success">
                <CheckCircle2Icon className="h-4.5 w-4.5" />
              </span>
              <CardDescription>Impact</CardDescription>
              <CardTitle className="flex items-baseline gap-2 text-3xl tracking-tight">
                {data.lessonsCompleted}
                <span className="text-sm font-medium text-muted-foreground">
                  lessons done
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <Progress
                value={data.lessonPct}
                variant="success"
                fillClassName="bg-primary"
              />
              <p className="text-xs text-muted-foreground">
                {data.lessonPct}% of {data.courseTitle}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="w-full overflow-hidden border-none ring-1 ring-primary/25">
          <CardContent className="relative flex flex-col items-start justify-between gap-5 bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-primary-foreground/80">
                {data.continueAction.kind === "review"
                  ? `${data.continueAction.count} card${data.continueAction.count === 1 ? "" : "s"} due for review`
                  : data.continueAction.kind === "lesson"
                    ? `Next up · ${data.continueAction.lesson.moduleTitle}`
                    : "Course complete"}
              </CardDescription>
              <span className="text-xl font-semibold tracking-tight">
                {data.continueAction.kind === "review"
                  ? "Time to strengthen your memory"
                  : data.continueAction.kind === "lesson"
                    ? data.continueAction.lesson.title
                    : "You finished the course"}
              </span>
            </div>
            {data.continueAction.kind === "complete" ? (
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="shrink-0 font-semibold"
              >
                <Link href="/learn">Browse more courses</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="shrink-0 text-lg font-semibold shadow-md"
              >
                <Link
                  href={
                    data.continueAction.kind === "review"
                      ? "/review"
                      : `/learn/${data.continueAction.lesson.id}`
                  }
                >
                  <PlayIcon className="h-5 w-5" />
                  {continueLabel}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            icon={TrophyIcon}
            label="Words learned"
            value={String(data.wordsLearned)}
            sub="unique flashcards reviewed"
          />
          <Tile
            icon={BadgeCheckIcon}
            label="Accuracy"
            value={data.accuracy === null ? "—" : `${data.accuracy}%`}
            sub="flashcard ratings"
          />
          <Tile
            icon={FlameIcon}
            label="Longest streak"
            value={`${gam.longestStreak}`}
            sub={`${gam.longestStreak === 1 ? "day" : "days"}`}
            accent="reward"
          />
          <Tile
            icon={CalendarIcon}
            label="Total XP this week"
            value={String(gam.totalXp)}
            sub="keep the momentum going"
            accent={dailyGoal.complete ? "success" : "primary"}
          />
        </section>

        <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="animate-card-in">
            <CardHeader>
              <CardTitle>Your skills</CardTitle>
              <CardDescription>
                Exercise mastery across the four skills
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {data.fourSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete an exercise lesson to see your skill breakdown.
                </p>
              ) : (
                data.fourSkills.map((s) => {
                  const pct =
                    s.total === 0 ? 0 : Math.round((s.passed / s.total) * 100);
                  const Icon = SKILL_ICONS[s.skill] ?? BookOpenIcon;
                  return (
                    <div key={s.skill} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {SKILL_LABELS[s.skill] ?? s.skill}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          {s.passed}/{s.total} exercises
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="animate-card-in">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Your latest XP earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet — complete a lesson or review a card to earn
                  XP.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {data.recentActivity.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-reward/15 px-2 py-0.5 text-xs font-semibold text-reward">
                          +{event.amount} XP
                        </span>
                        <span className="font-medium">
                          {REASON_LABELS[event.reason] ?? event.reason}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatTime(event.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {gam.achievements.some((a) => a.earned) && (
          <Card className="w-full animate-card-in">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Milestones you have unlocked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {gam.achievements
                  .filter((a) => a.earned)
                  .slice(0, 5)
                  .map((a) => (
                    <div
                      key={a.code}
                      className="flex flex-col items-center gap-1.5 rounded-lg bg-reward/10 p-3 text-center ring-1 ring-reward/20"
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <span className="w-full truncate text-xs font-medium">
                        {a.title}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.additionalLanguages.length > 0 && (
          <Card className="w-full">
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
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Level {lang.levelCode} · {lang.lessonsCompleted}/
                      {lang.lessonsTotal} lessons
                    </span>
                    <Progress
                      value={lang.pct}
                      className="h-1.5 max-w-56"
                    />
                  </div>
                  <SwitchLanguageButton enrollmentId={lang.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.dueNow > 0 && (
          <Card className="w-full">
            <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-1">
                <span className="font-medium">
                  {data.dueNow} card{data.dueNow === 1 ? "" : "s"} ready for
                  review
                </span>
                <span className="text-sm text-muted-foreground">
                  SRS keeps your memory fresh — a few minutes is all it takes.
                </span>
              </div>
              <Button asChild size="sm">
                <Link href="/review">Start review</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin(user) && (
          <Link
            href="/admin"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Admin
          </Link>
        )}
        <SignOutButton />
      </div>
    </main>
  );
}