export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-10 pt-2 animate-pulse bg-background">
      {/* Header Skeleton */}
      <div className="flex items-center h-[56px] mb-4">
        <div className="h-10 w-10 bg-muted rounded-full mr-3"></div>
        <div className="h-6 w-32 bg-muted rounded-md"></div>
      </div>

      {/* Swaps List Skeleton */}
      <div className="flex flex-col gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border bg-card">
            <div className="h-20 w-20 bg-muted rounded-xl shrink-0"></div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/2 bg-muted rounded"></div>
              <div className="h-6 w-24 bg-muted rounded-full mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
