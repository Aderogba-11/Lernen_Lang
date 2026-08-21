import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Lernen Lang
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Learn languages through structured lessons, flashcards, and
            practice across reading, listening, writing, and speaking.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/account">Continue as {user.name}</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/register">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
