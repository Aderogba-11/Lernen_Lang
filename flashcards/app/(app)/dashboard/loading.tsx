export default function DashboardLoading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 p-4 sm:p-6 dark:bg-black">
      <div className="flex w-full max-w-4xl animate-pulse flex-col gap-6">
        <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
        <div className="h-40 rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
      </div>
    </main>
  );
}
