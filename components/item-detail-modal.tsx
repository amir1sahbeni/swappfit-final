"use client"

import { useState } from "react"
import { X, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import type { Item } from "@/lib/types"

export function ItemDetailModal({ items, onClose }: { items: Item[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentItem = items[currentIndex]

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1)
  }

  if (!currentItem) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-[350px] overflow-hidden rounded-3xl bg-card shadow-2xl animate-in fade-in zoom-in-95"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        {items.length > 1 && (
          <div className="absolute right-14 top-4 z-20 flex h-8 items-center justify-center rounded-full bg-black/40 px-3 text-xs font-medium text-white backdrop-blur-md">
            {currentIndex + 1} / {items.length}
          </div>
        )}

        <div className="relative aspect-square w-full">
          <img 
            src={currentItem.image || "/placeholder.svg"} 
            alt={currentItem.name}
            className="h-full w-full object-cover"
          />
          
          {items.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {currentIndex < items.length - 1 && (
                <button 
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                {items.map((_, i) => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">{currentItem.name}</h2>
              {currentItem.brand && (
                <p className="text-sm font-medium text-muted-foreground">{currentItem.brand}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">{currentItem.price}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {currentItem.size && (
              <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                Size: {currentItem.size}
              </div>
            )}
            {currentItem.condition && (
              <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {currentItem.condition}
              </div>
            )}
          </div>

          {currentItem.description && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
              <p className="mt-1 text-sm text-foreground">{currentItem.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
