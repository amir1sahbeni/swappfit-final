import Link from "next/link"
import { redirect } from "next/navigation"

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
      <header className="flex items-start justify-between bg-background pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </header>

      <ChatsList initialConversations={conversations} recentSellers={recentSellers} />

      <BottomNav />
    </main>
  )
}
