import { createServerClient } from '@/lib/supabase/server'
import type { SwapProposal } from '@/lib/types'

export async function getProposalById(id: string) {
  const supabase = await createServerClient()

  // Step 1: Get the proposal itself
  const { data: proposal, error } = await supabase
    .from('swap_proposals')
    .select('id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, note, completed_at, cancelled_at, created_at, updated_at, proposer_confirmed, receiver_confirmed')
    .eq('id', id)
    .single()

  if (error || !proposal) return null

  // Step 2: Get proposer profile
  const { data: proposer } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_url, rating, review_count')
    .eq('id', proposal.proposer_id)
    .single()

  // Step 3: Get receiver profile
  const { data: receiver } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_url, rating, review_count')
    .eq('id', proposal.receiver_id)
    .single()

  // Step 4: Get proposal items with their listings
  const { data: proposalItems } = await supabase
    .from('swap_proposal_items')
    .select('proposal_id, listing_id, side, created_at')
    .eq('proposal_id', id)

  // Step 5: Get all listing IDs from proposal items
  const listingIds = (proposalItems || []).map(item => item.listing_id)

  let listings: any[] = []
  if (listingIds.length > 0) {
    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng, color')
      .in('id', listingIds)
    listings = listingsData || []
  }

  // Step 6: Get legacy single items if they exist
  let offeredItem = null
  let wantedItem = null

  if (proposal.offered_item_id) {
    const { data } = await supabase
      .from('listings')
      .select('id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng, color')
      .eq('id', proposal.offered_item_id)
      .single()
    offeredItem = data
  }

  if (proposal.wanted_item_id) {
    const { data } = await supabase
      .from('listings')
      .select('id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng, color')
      .eq('id', proposal.wanted_item_id)
      .single()
    wantedItem = data
  }

  // Step 7: Assemble the result
  const assembledItems = (proposalItems || []).map(item => ({
    proposal_id: item.proposal_id,
    listing_id: item.listing_id,
    side: item.side,
    created_at: item.created_at,
    listing: listings.find(l => l.id === item.listing_id) || null
  }))

  return {
    ...proposal,
    proposer,
    receiver,
    offered_item: offeredItem,
    wanted_item: wantedItem,
    swap_proposal_items: assembledItems
  }
}

export async function getUserProposals(userId: string): Promise<SwapProposal[]> {
  const supabase = await createServerClient()

  // Step 1: Get the proposals (with read status; falls back if columns don't exist yet)
  let { data: proposals, error } = await supabase
    .from('swap_proposals')
    .select('id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, note, completed_at, cancelled_at, created_at, updated_at, proposer_confirmed, receiver_confirmed, proposer_read, receiver_read')
    .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
    .not('hidden_for', 'cs', `{${userId}}`)
    .order('created_at', { ascending: false })
    .limit(100)

  // If the read-status columns don't exist in the DB yet, fall back to a query without them
  if (error) {
    console.warn('getUserProposals: falling back without read columns:', error.message)
    const fallback = await supabase
      .from('swap_proposals')
      .select('id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, note, completed_at, cancelled_at, created_at, updated_at, proposer_confirmed, receiver_confirmed')
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .not('hidden_for', 'cs', `{${userId}}`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (fallback.error || !fallback.data) return []
    proposals = fallback.data
  }

  if (!proposals) return []

  // Step 2: Get all unique user IDs (proposers and receivers)
  const userIds = new Set<string>()
  proposals.forEach(p => {
    userIds.add(p.proposer_id)
    userIds.add(p.receiver_id)
  })

  // Step 3: Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_url, rating, review_count')
    .in('id', Array.from(userIds))

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  // Step 4: Get all proposal items
  const proposalIds = proposals.map(p => p.id)
  const { data: allProposalItems } = await supabase
    .from('swap_proposal_items')
    .select('proposal_id, listing_id, side, created_at')
    .in('proposal_id', proposalIds)

  // Step 5: Get all listing IDs from proposal items
  const listingIds = new Set<string>()
  const itemsByProposal = new Map<string, any[]>()
  ;(allProposalItems || []).forEach(item => {
    listingIds.add(item.listing_id)
    if (!itemsByProposal.has(item.proposal_id)) {
      itemsByProposal.set(item.proposal_id, [])
    }
    itemsByProposal.get(item.proposal_id)!.push(item)
  })

  // Step 6: Get legacy listing IDs
  proposals.forEach(p => {
    if (p.offered_item_id) listingIds.add(p.offered_item_id)
    if (p.wanted_item_id) listingIds.add(p.wanted_item_id)
  })

  // Step 7: Fetch all listings
  let listings: any[] = []
  if (listingIds.size > 0) {
    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng, color')
      .in('id', Array.from(listingIds))
    listings = listingsData || []
  }

  const listingMap = new Map(listings.map(l => [l.id, l]))

  // Step 8: Assemble results
  const assembled = proposals.map(proposal => {
    const proposalItems = itemsByProposal.get(proposal.id) || []
    const assembledItems = proposalItems.map(item => ({
      proposal_id: item.proposal_id,
      listing_id: item.listing_id,
      side: item.side,
      created_at: item.created_at,
      listing: listingMap.get(item.listing_id) || null
    }))

    return {
      ...proposal,
      proposer: profileMap.get(proposal.proposer_id) || null,
      receiver: profileMap.get(proposal.receiver_id) || null,
      offered_item: proposal.offered_item_id ? listingMap.get(proposal.offered_item_id) || null : null,
      wanted_item: proposal.wanted_item_id ? listingMap.get(proposal.wanted_item_id) || null : null,
      swap_proposal_items: assembledItems
    }
  })

  return assembled as SwapProposal[]
}
