export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-5 animate-pulse bg-background">
      {/* Title Skeleton */}
      <div className="h-8 w-40 bg-muted rounded-md"></div>

      {/* Toggle Skeleton */}
      <div className="mt-4 flex gap-2">
        <div className="flex-1 h-9 rounded-full bg-muted"></div>
        <div className="flex-1 h-9 rounded-full bg-muted"></div>
      </div>

      {/* Search Input Skeleton */}
      <div className="mt-4 h-[52px] rounded-full bg-muted"></div>

      {/* Categories Skeleton */}
      <div className="mt-4 flex gap-2.5 overflow-x-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="shrink-0 h-9 w-20 rounded-full bg-muted"></div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 w-full bg-muted rounded-2xl"></div>
        ))}
      </div>
    </main>
  )
}
