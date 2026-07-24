export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2 animate-pulse bg-background">
      {/* Header Skeleton */}
      <div className="flex items-center h-[56px] mb-4">
        <div className="h-10 w-10 bg-muted rounded-full mr-3"></div>
        <div className="h-6 w-32 bg-muted rounded-md"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 w-full bg-muted rounded-2xl"></div>
        ))}
      </div>
    </main>
  )
}
