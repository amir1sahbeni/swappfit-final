import { notFound, redirect } from "next/navigation"
import { getProposalById } from "@/lib/queries/proposals"
import { createServerClient } from "@/lib/supabase/server"
import { RatingView } from "./rating-view"

export default async function RatingPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ type?: string }> }) {
  const { id } = await params
  const { type } = await searchParams
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  if (type === 'purchase') {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*, buyer:profiles!purchases_buyer_id_fkey(*), seller:profiles!purchases_seller_id_fkey(*)')
      .eq('id', id)
      .single()
      
    if (!purchase) notFound()
    if (purchase.status !== 'completed') redirect(`/purchase/${id}`)
    
    const partner = purchase.buyer_id === user.id ? purchase.seller : purchase.buyer
    return <RatingView proposalId={null} partner={partner!} />
  }

  const proposal = await getProposalById(id)
  if (!proposal) notFound()

  if (proposal.status !== "completed") {
    redirect(`/exchange/${id}`)
  }

  const isReceiver = proposal.receiver_id === user.id
  const partner = isReceiver ? proposal.proposer : proposal.receiver

  return <RatingView proposalId={proposal.id} partner={partner!} />
}
