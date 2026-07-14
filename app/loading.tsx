export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-5 animate-pulse">
      <header className="flex items-start justify-between">
        <div>
          <div className="h-8 w-32 bg-muted rounded-md mb-2"></div>
          <div className="h-4 w-48 bg-muted rounded-md"></div>
        </div>
        <div className="h-10 w-10 bg-muted rounded-full"></div>
      </header>

      <div className="mt-5 flex items-center gap-3 rounded-full bg-muted px-4 py-3.5 h-12"></div>

      <div className="mt-5 flex gap-2.5 overflow-x-hidden px-5 -mx-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shrink-0 h-9 w-20 rounded-full bg-muted"></div>
        ))}
      </div>

      <section className="mt-6">
        <div className="h-4 w-16 bg-muted rounded mb-3"></div>
        <div className="h-64 w-full bg-muted rounded-2xl"></div>
      </section>

      <section className="mt-6">
        <div className="h-4 w-16 bg-muted rounded mb-3"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 w-full bg-muted rounded-2xl"></div>
          ))}
        </div>
      </section>
    </main>
  )
}
