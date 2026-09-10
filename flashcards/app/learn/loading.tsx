export default function LearnLoading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 p-4 sm:p-6 dark:bg-black">
      <div className="flex w-full max-w-4xl animate-pulse flex-col gap-4">
        <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </main>
  );
}
