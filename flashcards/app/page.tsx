import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, FlameIcon, RefreshCwIcon, TargetIcon } from "lucide-react";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-reward/10 blur-3xl" />
      <main className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <FlameIcon className="h-3.5 w-3.5" />
            Bite-sized language learning
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Lernen Lang
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Learn languages through structured lessons, flashcards, and practice
            across reading, listening, writing, and speaking.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard">Continue as {user.name}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">Get started</Link>
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
        <div className="grid w-full max-w-xl grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-4">
            <BookOpenIcon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Lessons</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-4">
            <RefreshCwIcon className="h-5 w-5 text-success" />
            <span className="text-sm font-medium">Review</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-4">
            <TargetIcon className="h-5 w-5 text-reward" />
            <span className="text-sm font-medium">Daily goals</span>
          </div>
        </div>
      </main>
    </div>
  );
}