"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface UserAvatarProps {
  id: string
  name: string
  avatarUrl: string | null
  hasNewListing?: boolean
  className?: string
}

export function UserAvatar({ id, name, avatarUrl, hasNewListing, className = "h-14 w-14" }: UserAvatarProps) {
  const router = useRouter()

  const [hasSeen, setHasSeen] = useState(false)

  useEffect(() => {
    if (hasNewListing) {
      const seen = localStorage.getItem(`seen_listings_${id}`)
      if (seen === 'true') {
        setHasSeen(true)
      }
    }
  }, [id, hasNewListing])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasNewListing) {
      localStorage.setItem(`seen_listings_${id}`, 'true')
      setHasSeen(true)
    }
    router.push(`/user/${id}`)
  }

  const showRing = hasNewListing && !hasSeen

  return (
    <div
      onClick={handleClick}
      className={`shrink-0 block rounded-full cursor-pointer ${className} ${showRing ? "bg-brand-gradient p-[2px]" : ""}`}
    >
      <img
        src={avatarUrl || "/placeholder.svg"}
        alt={name}
        className={`h-full w-full rounded-full object-cover ${showRing ? "border-[2.5px] border-background" : ""}`}
      />
    </div>
  )
}
