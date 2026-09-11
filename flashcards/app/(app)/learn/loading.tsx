export default function LearnLoading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-4xl animate-pulse flex-col gap-4">
        <div className="h-8 w-40 rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-border bg-muted/60"
          />
        ))}
      </div>
    </main>
  );
}