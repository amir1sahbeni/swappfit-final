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

  const wantedItems = (proposal.swap_proposal_items || [])
    .filter(i => i.side === 'wanted' && i.listing)
    .map(i => listingToItem(i.listing!))

  const offeredItems = (proposal.swap_proposal_items || [])
    .filter(i => i.side === 'offered' && i.listing)
    .map(i => listingToItem(i.listing!))

  // Legacy fallback for 1-to-1 swaps (when swap_proposal_items is empty)
  if (wantedItems.length === 0 && proposal.wanted_item) {
    wantedItems.push(listingToItem(proposal.wanted_item))
  }
  if (offeredItems.length === 0 && proposal.offered_item) {
    offeredItems.push(listingToItem(proposal.offered_item))
  }

  return (
    <ExchangeView 
      proposal={proposal} 
      partner={partner!} 
      isReceiver={isReceiver} 
      wantedItems={wantedItems}
      offeredItems={offeredItems}
      currentUserId={user.id}
    />
  )
}
