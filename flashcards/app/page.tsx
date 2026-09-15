import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/landing/feature-card";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  FlameIcon,
  RefreshCwIcon,
  TargetIcon,
  ZapIcon,
} from "lucide-react";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-reward/10 blur-3xl" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
        <section
          aria-label="Introduction"
          className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
        >
          <div className="flex flex-col items-start gap-8">
            <div className="flex flex-col items-start gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <FlameIcon className="h-3.5 w-3.5" />
                Bite-sized language learning
              </span>
              <h1 className="font-heading text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Master new languages,{" "}
                <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                  one bite at a time
                </span>
                .
              </h1>
              <p className="max-w-xl text-pretty text-lg text-muted-foreground">
                Learn languages through structured lessons, flashcards, and
                practice across reading, listening, writing, and speaking.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              {user ? (
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <Link href="/dashboard">
                    Continue as {user.name}
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="group w-full sm:w-auto"
                  >
                    <Link href="/register">
                      Get started
                      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                </>
              )}
            </div>

            <dl className="flex w-full flex-wrap items-center gap-x-9 gap-y-4 border-t border-border pt-8">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckIcon className="size-4" />
                </span>
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Structured</dt>
                  <dd className="text-sm font-semibold">Lessons</dd>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-success/10 text-success">
                  <RefreshCwIcon className="size-4" />
                </span>
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Smart</dt>
                  <dd className="text-sm font-semibold">Flashcards</dd>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-reward/10 text-reward">
                  <TargetIcon className="size-4" />
                </span>
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Daily</dt>
                  <dd className="text-sm font-semibold">Goals</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-reward/15 blur-2xl" />
            <div className="animate-card-in rounded-[1.75rem] border border-border bg-card p-2 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.35)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border/80 bg-background p-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <BookOpenIcon className="size-3.5 text-primary" />
                    Lesson · Vegetables
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    3 / 12
                  </span>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-8">
                  <span className="font-heading text-lg font-semibold text-foreground">
                    la carotte
                  </span>
                  <span className="text-sm text-muted-foreground">the carrot · f.</span>
                </div>

                <div className="flex items-center gap- Joe3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="animate-progress-fill h-full w-3/4 rounded-full bg-primary" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ZapIcon className="size-3.5 text-reward" />
                    <span>
                      <span className="font-semibold text-reward">+120 XP</span> this week
                    </span>
                  </span>
                  <span className="animate-streak-pulse inline-flex items-center gap-1.5 rounded-full bg-reward/10 px-2.5 py-1 text-xs font-semibold text-reward">
                    <FlameIcon className="size-3.5" />
                    7-day streak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Features" className="mx-auto w-full max-w-4xl text-center">
          <div className="mb-10 flex flex-col items-center gap-3">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to stay consistent
            </h2>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              A focused toolkit that makes daily practice feel effortless.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={BookOpenIcon}
              title="Structured lessons"
              description="Progress through bite-sized lessons covering reading, listening, writing, and speaking."
            />
            <FeatureCard
              icon={RefreshCwIcon}
              title="Flashcard reviews"
              description="Review vocabulary with smart, spaced flashcards that adapt to your pace."
            />
            <FeatureCard
              icon={TargetIcon}
              title="Daily goals & streaks"
              description="Stay motivated with daily goals, XP, and streaks that reward consistency."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
