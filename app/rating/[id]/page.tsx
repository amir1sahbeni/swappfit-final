import { notFound, redirect } from "next/navigation"
import { getProposalById } from "@/lib/queries/proposals"
import { createServerClient } from "@/lib/supabase/server"
import { RatingView } from "./rating-view"

export default async function RatingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const proposal = await getProposalById(id)
  if (!proposal) notFound()

  if (proposal.status !== "completed") {
    redirect(`/exchange/${id}`)
  }

  const isReceiver = proposal.receiver_id === user.id
  const partner = isReceiver ? proposal.proposer : proposal.receiver

  return <RatingView proposalId={proposal.id} partner={partner!} />
}
