"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function FollowButton({
  followerId,
  followingId,
  initialIsFollowing,
  className = "h-10 w-full rounded-2xl",
}: {
  followerId: string
  followingId: string
  initialIsFollowing: boolean
  className?: string
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFollowToggle = async () => {
    if (loading) return
    setLoading(true)

    const supabase = createClient()

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId)
          
        if (error) throw new Error(error.message)
        setIsFollowing(false)
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: followerId, following_id: followingId })
          
        if (error) throw new Error(error.message)
        setIsFollowing(true)
      }
      router.refresh()
    } catch (err: any) {
      console.error("Follow error:", err)
      alert("Failed to update follow status: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`${className} font-bold transition-all active:scale-[0.98] ${
        isFollowing
          ? "bg-muted border border-border text-foreground"
          : "bg-brand-gradient text-primary-foreground shadow-brand"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  )
}
