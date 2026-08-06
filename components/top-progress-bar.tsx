"use client"

import { useEffect, useState } from "react"

export function TopProgressBar({ isUpdating }: { isUpdating: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isUpdating) {
      setShow(true)
    } else {
      const timer = setTimeout(() => setShow(false), 500) // fade out delay
      return () => clearTimeout(timer)
    }
  }, [isUpdating])

  if (!show && !isUpdating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 w-full overflow-hidden">
      <div 
        className={`h-full bg-primary transition-all duration-300 ease-in-out ${
          isUpdating ? "w-2/3 animate-pulse" : "w-full opacity-0"
        }`} 
      />
    </div>
  )
}
