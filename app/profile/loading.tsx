export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-8 animate-pulse bg-background">
      <div className="flex flex-col items-center text-center">
        <div className="h-24 w-24 rounded-full bg-muted shadow-sm mb-4"></div>
        <div className="h-7 w-48 bg-muted rounded-md mb-2"></div>
        <div className="h-4 w-32 bg-muted rounded-md mb-4"></div>
        
        <div className="flex items-center justify-center gap-6 w-full px-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="h-6 w-10 bg-muted rounded-md mb-1"></div>
            <div className="h-3 w-16 bg-muted rounded-md"></div>
          </div>
          <div className="h-8 w-px bg-border"></div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-10 bg-muted rounded-md mb-1"></div>
            <div className="h-3 w-16 bg-muted rounded-md"></div>
          </div>
          <div className="h-8 w-px bg-border"></div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-10 bg-muted rounded-md mb-1"></div>
            <div className="h-3 w-16 bg-muted rounded-md"></div>
          </div>
        </div>

        <div className="h-20 w-full bg-muted rounded-2xl mb-8"></div>
        <div className="h-4 w-24 bg-muted rounded-md self-start mb-4"></div>
        
        <div className="grid grid-cols-2 gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 w-full bg-muted rounded-2xl"></div>
          ))}
        </div>
      </div>
    </main>
  )
}
