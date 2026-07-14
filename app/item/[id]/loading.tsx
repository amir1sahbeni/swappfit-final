export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh pb-28 animate-pulse bg-background">
      <div className="relative aspect-square w-full bg-muted"></div>
      <div className="px-5 pt-5 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full">
            <div className="h-8 w-3/4 bg-muted rounded-md mb-2"></div>
            <div className="h-6 w-1/4 bg-muted rounded-md mb-3"></div>
            <div className="h-4 w-1/2 bg-muted rounded-md"></div>
          </div>
          <div className="h-12 w-12 bg-muted rounded-full shrink-0"></div>
        </div>

        <div className="mt-8">
          <div className="h-4 w-24 bg-muted rounded-md mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded-md"></div>
            <div className="h-4 w-full bg-muted rounded-md"></div>
            <div className="h-4 w-3/4 bg-muted rounded-md"></div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm border border-border/50">
          <div className="h-12 w-12 rounded-full bg-muted"></div>
          <div className="min-w-0 flex-1">
            <div className="h-5 w-1/2 bg-muted rounded-md mb-2"></div>
            <div className="h-4 w-1/3 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    </main>
  )
}
