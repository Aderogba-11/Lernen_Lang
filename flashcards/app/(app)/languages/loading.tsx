export default function LanguagesLoading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-background p-4 sm:p-6">
      <div className="flex w-full max-w-2xl animate-pulse flex-col gap-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border bg-muted/60"
            />
          ))}
        </div>
      </div>
    </main>
  );
}