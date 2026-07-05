import { notFound, redirect } from "next/navigation"
import { getProfile } from "@/lib/queries/profiles"
import { getConversationWithUser, getConversationMessages } from "@/lib/queries/conversations"
import { getFollowedUsersWithRecentListings } from "@/lib/queries/follows"
import { createServerClient } from "@/lib/supabase/server"
import { ChatView } from "./chat-view"

export default async function ChatDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ sellerId: string }>
  searchParams: Promise<{ message?: string; prefill?: string }>
}) {
  const { sellerId } = await params
  const { message, prefill } = await searchParams
  
  let initialText = message || ""
  if (prefill === "buy") {
    initialText = "Hi! I just purchased this item and would like to arrange payment and delivery."
  }
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")
    
  if (user.id === sellerId) redirect("/chats") // Can't chat with self

  const partnerProfile = await getProfile(sellerId)
  if (!partnerProfile) notFound()

  const conversation = await getConversationWithUser(sellerId)
  
  let initialMessages: any[] = []
  if (conversation) {
    initialMessages = await getConversationMessages(conversation.id)
  }

  const recentSellers = await getFollowedUsersWithRecentListings(user.id)
  const hasNewListing = recentSellers.includes(sellerId)

  return (
    <ChatView 
      partner={partnerProfile} 
      currentUserId={user.id} 
      conversationId={conversation?.id} 
      initialMessages={initialMessages} 
      hasNewListing={hasNewListing}
      initialText={initialText}
    />
  )
}
