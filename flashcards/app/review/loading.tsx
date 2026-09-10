export default function ReviewLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 p-4 sm:p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl animate-pulse flex-col gap-4">
        <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-64 rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 flex-1 rounded bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
