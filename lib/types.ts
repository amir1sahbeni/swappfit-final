// Canonical TypeScript types aligned with the Supabase DB schema.
// All app code should import from here — not from lib/data.ts.

export type Condition = 'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair'
export type ListingStatus = 'active' | 'swapped' | 'sold' | 'removed'
export type ProposalStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
export type NotificationType = 'swap_proposal' | 'swap_accepted' | 'swap_declined' | 'swap_cancelled' | 'swap_completed' | 'message' | 'rating' | 'like' | 'purchase_request' | 'purchase_accepted' | 'purchase_rejected' | 'purchase_cancelled' | 'purchase_completed' | 'purchase_confirmed' | 'new_follower'

// ─────────────────────────────────────────────
// Database row types
// ─────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  handle: string
  avatar_url: string | null
  bio: string
  location: string
  rating: number
  review_count: number
  swap_count: number
  saved_listings: string[]
  created_at: string
  updated_at: string
  governorate: string
  city: string
  location_sharing_enabled: boolean
  precise_lat: number | null
  precise_lng: number | null
}

export interface Listing {
  id: string
  seller_id: string
  name: string
  brand: string
  size: string
  /** Stored in cents, e.g. 12800 = $128 */
  price: number
  category: string
  condition: Condition
  images: string[]
  size_type?: string
  gender?: string
  status: ListingStatus
  created_at: string
  updated_at: string
  listing_lat: number | null
  listing_lng: number | null
  // Joined from profiles
  profiles?: Profile
}

export interface SwapProposal {
  id: string
  proposer_id: string
  receiver_id: string
  offered_item_id: string
  wanted_item_id: string
  note: string
  status: ProposalStatus
  created_at: string
  updated_at: string
  proposer_confirmed?: boolean
  receiver_confirmed?: boolean
  completed_at?: string | null
  // Joined
  offered_item?: Listing
  wanted_item?: Listing
  proposer?: Profile
  receiver?: Profile
}

export interface Conversation {
  id: string
  participant_a: string
  participant_b: string
  listing_id: string | null
  proposal_id: string | null
  last_message: string
  last_message_at: string
  created_at: string
  purchase_id?: string | null
  /** Array of user IDs who have soft-deleted this conversation from their view */
  deleted_for?: string[] | null
  // Joined
  listing?: Listing
  partner?: Profile
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  read: boolean
  created_at: string
  reply_to_message_id?: string | null
  reactions?: Record<string, any> | null
  deleted_at?: string | null
  deleted_for?: string[] | null
  message_type?: 'text' | 'image' | 'voice'
  media_url?: string | null
  media_metadata?: Record<string, any> | null
  read_at?: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  entity_id: string | null
  /** Status of the referenced entity at the time the notification was created */
  entity_status?: string | null
  text: string
  read: boolean
  created_at: string
  // Joined
  actor?: Profile
}

export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  proposal_id: string | null
  rating: number
  tags: string[]
  body: string
  created_at: string
  reviewer?: Profile
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export type PurchaseStatus = 'pending_seller_approval' | 'accepted' | 'completed' | 'cancelled'

export interface Purchase {
  id: string
  buyer_id: string
  seller_id: string
  status: PurchaseStatus
  total_price: number
  created_at: string
  updated_at: string
  buyer_confirmed?: boolean
  seller_confirmed?: boolean
  completed_at?: string | null
  // Joined
  buyer?: Profile
  seller?: Profile
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  item_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
  // Joined
  item?: Listing
}

// ─────────────────────────────────────────────
// Legacy UI types — kept so existing components (ItemCard, etc.) compile
// without modification. Populated via adapter helpers in lib/utils.ts.
// ─────────────────────────────────────────────

export interface Item {
  id: string
  name: string
  price: string       // display string e.g. "$128"
  image: string
  category: string
  condition: Condition
  brand: string
  size: string
  description: string
  sellerId: string
  distance: string
  postedAt: string
  status?: string
  listing_lat: number | null
  listing_lng: number | null
  seller_city: string | undefined
  seller_governorate: string | undefined
}

export interface Seller {
  id: string
  name: string
  handle: string
  avatar: string
  bio: string
  rating: number
  reviews: number
  swaps: number
  location: string
}
