import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { createServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { SwapsList } from './swaps-list'

export const dynamic = "force-dynamic"

export default async function SwapsPage() {
  const t = await getTranslations('Swaps')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/swaps')

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-10 bg-background">
      <PageHeader title={t('title')} />
      <SwapsList userId={user.id} />
    </main>
  )
}
