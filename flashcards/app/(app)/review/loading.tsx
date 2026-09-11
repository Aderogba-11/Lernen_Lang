export default function ReviewLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-2xl animate-pulse flex-col gap-4">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-64 rounded-xl border border-border bg-muted/60" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 flex-1 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}