import Link from "next/link"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { BottomNav } from "@/components/bottom-nav"
import { createServerClient } from "@/lib/supabase/server"
import { getUserConversations } from "@/lib/queries/conversations"
import { getFollowedUsersWithRecentListings } from "@/lib/queries/follows"
import { ChatsList } from "./chats-list"
import { getTranslations } from 'next-intl/server'

export default async function ChatsPage() {
  const t = await getTranslations('Chats')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const conversations = await getUserConversations()
  const recentSellers = await getFollowedUsersWithRecentListings(user.id)

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <ChatsList initialConversations={conversations} recentSellers={recentSellers} />

      <BottomNav />
    </main>
  )
}
