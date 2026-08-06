"use client"

import { X, Tag } from "lucide-react"
import type { Item } from "@/lib/types"

export function ItemDetailModal({ item, onClose }: { item: Item; onClose: () => void }) {
  // If we had multiple images we would show them in a carousel, but for now Item has a single image string.
  // We'll show the image, name, brand, size, price, condition, description.
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-[350px] overflow-hidden rounded-3xl bg-card shadow-2xl animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-square w-full">
          <img 
            src={item.image || "/placeholder.svg"} 
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">{item.name}</h2>
              {item.brand && (
                <p className="text-sm font-medium text-muted-foreground">{item.brand}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">{item.price}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.size && (
              <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                Size: {item.size}
              </div>
            )}
            {item.condition && (
              <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {item.condition}
              </div>
            )}
          </div>

          {item.description && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
              <p className="mt-1 text-sm text-foreground">{item.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
