import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { createServerClient } from '@/lib/supabase/server'
import { getUserProposals } from '@/lib/queries/proposals'
import { getUserPurchases } from '@/lib/queries/purchases'
import { getTranslations } from 'next-intl/server'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { SwapsList } from './swaps-list'

export const dynamic = "force-dynamic"

export default async function SwapsPage() {
  const t = await getTranslations('Swaps')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/swaps')

  const [proposals, purchases] = await Promise.all([
    getUserProposals(user.id),
    getUserPurchases(user.id)
  ])

  // Combine and sort by date
  const history = [
    ...proposals.map(p => ({ ...p, type: 'swap' as const })),
    ...purchases.map(p => ({ ...p, type: 'purchase' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-10 bg-background">
      <RealtimeRefresh table="swap_proposals" />
      <RealtimeRefresh table="purchases" />
      <PageHeader title={t('title')} />
      <SwapsList history={history} userId={user.id} />
    </main>
  )
}
