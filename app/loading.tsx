export default function Loading() {
  return (
    <div className="animate-pulse p-6">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-6 w-48 rounded-md bg-muted/50" />
          <div className="mt-2 h-4 w-64 rounded-md bg-muted/30" />
        </div>
        <div className="h-8 w-24 rounded-md bg-muted/30" />
      </div>

      {/* Metric cards skeleton */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-muted/40" />
              <div className="h-8 w-8 rounded-lg bg-muted/30" />
            </div>
            <div className="h-7 w-24 rounded bg-muted/50" />
            <div className="h-3 w-32 rounded bg-muted/20" />
          </div>
        ))}
      </div>

      {/* Content cards skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border bg-card" />
        <div className="h-64 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
