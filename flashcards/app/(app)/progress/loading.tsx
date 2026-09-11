export default function ProgressLoading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-4xl animate-pulse flex-col gap-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border bg-muted/60"
            />
          ))}
        </div>
        <div className="h-48 rounded-xl border border-border bg-muted/60" />
      </div>
    </main>
  );
}