"use client"

import { X } from "lucide-react"
import type { Item } from "@/lib/types"

export function ItemListModal({ 
  items, 
  title,
  onClose,
  onSelect 
}: { 
  items: Item[]; 
  title: string;
  onClose: () => void;
  onSelect: (item: Item) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Bottom Sheet Modal */}
      <div className="relative z-10 w-full max-h-[85vh] flex flex-col rounded-t-[32px] bg-card shadow-2xl animate-in slide-in-from-bottom-full">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto px-6 pb-8 pt-2 hide-scrollbar flex flex-col gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex items-center gap-4 rounded-2xl bg-muted p-3 text-left transition-transform active:scale-95"
            >
              <img 
                src={item.image || "/placeholder.svg"} 
                alt={item.name}
                className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-bold text-foreground text-sm">{item.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{item.price}</span>
                  {item.condition && (
                    <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {item.condition}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
