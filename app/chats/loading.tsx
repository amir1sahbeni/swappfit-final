export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-5 animate-pulse bg-background">
      <header className="mb-6">
        <div className="h-8 w-32 bg-muted rounded-md mb-2"></div>
        <div className="h-4 w-48 bg-muted rounded-md"></div>
      </header>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm items-center">
            <div className="h-12 w-12 rounded-full bg-muted shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-5 w-1/2 bg-muted rounded-md mb-2"></div>
              <div className="h-4 w-3/4 bg-muted rounded-md"></div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-muted shrink-0"></div>
          </div>
        ))}
      </div>
    </main>
  )
}
