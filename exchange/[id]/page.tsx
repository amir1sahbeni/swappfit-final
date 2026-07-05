import { notFound, redirect } from "next/navigation"
import { getProposalById } from "@/lib/queries/proposals"
import { listingToItem } from "@/lib/utils"
import { ExchangeView } from "./exchange-view"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function ExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const proposal = await getProposalById(id)
  if (!proposal) notFound()

  // Verify authorization
  if (proposal.proposer_id !== user.id && proposal.receiver_id !== user.id) {
    redirect("/")
  }

  const isReceiver = proposal.receiver_id === user.id
  const partner = isReceiver ? proposal.proposer : proposal.receiver

  return (
    <ExchangeView 
      proposal={proposal} 
      partner={partner!} 
      isReceiver={isReceiver} 
      wantedItem={listingToItem(proposal.wanted_item!)}
      offeredItem={listingToItem(proposal.offered_item!)}
      currentUserId={user.id}
    />
  )
}
