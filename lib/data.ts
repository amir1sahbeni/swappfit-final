export type Condition = "New" | "Like New" | "Excellent" | "Good" | "Fair"

export interface Item {
  id: string
  name: string
  price: string
  image: string
  category: string
  condition: Condition
  brand: string
  size: string
  description: string
  sellerId: string
  distance: string
  postedAt: string
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

export const categories = ["All", "Tops", "Bottoms", "Shoes", "Jackets", "Accessories"]

export const sellers: Record<string, Seller> = {
  mara: {
    id: "mara",
    name: "Mara Quinn",
    handle: "@maraq",
    avatar: "/sellers/mara.png",
    bio: "Vintage hunter. Curating timeless pieces with a story.",
    rating: 4.9,
    reviews: 132,
    swaps: 87,
    location: "Brooklyn, NY",
  },
  elise: {
    id: "elise",
    name: "Elise Vance",
    handle: "@elisev",
    avatar: "/sellers/elise.png",
    bio: "Soft minimalist wardrobe. Only pieces I truly love.",
    rating: 4.8,
    reviews: 64,
    swaps: 41,
    location: "Williamsburg, NY",
  },
  theo: {
    id: "theo",
    name: "Theo Marsh",
    handle: "@theom",
    avatar: "/sellers/theo.png",
    bio: "Sneakerhead. Trading kicks for kicks.",
    rating: 4.7,
    reviews: 98,
    swaps: 120,
    location: "Queens, NY",
  },
}

export const items: Item[] = [
  {
    id: "hero-jacket",
    name: "Vintage Cognac Leather Jacket",
    price: "$128",
    image: "/items/hero-jacket.png",
    category: "Jackets",
    condition: "Good",
    brand: "Schott",
    size: "M",
    description: "A beautifully worn cognac leather jacket with a buttery soft feel and timeless cropped cut.",
    sellerId: "mara",
    distance: "0.8 mi away",
    postedAt: "2h ago",
  },
  {
    id: "dress",
    name: "Floral Summer Midi Dress",
    price: "$42",
    image: "/items/dress.png",
    category: "Tops",
    condition: "Like New",
    brand: "Reformation",
    size: "S",
    description: "Breezy floral midi worn once. Perfect for warm afternoons and garden parties.",
    sellerId: "elise",
    distance: "1.2 mi away",
    postedAt: "5h ago",
  },
  {
    id: "sneakers",
    name: "Retro White Sneakers",
    price: "$65",
    image: "/items/sneakers.png",
    category: "Shoes",
    condition: "Good",
    brand: "Adidas",
    size: "10",
    description: "Clean retro silhouette with subtle cream accents. Lightly used, plenty of life left.",
    sellerId: "theo",
    distance: "2.0 mi away",
    postedAt: "1d ago",
  },
  {
    id: "denim",
    name: "High-Waist Vintage Denim",
    price: "$38",
    image: "/items/denim.png",
    category: "Bottoms",
    condition: "Excellent",
    brand: "Levi's",
    size: "28",
    description: "Classic high-waist vintage Levi's with the perfect amount of fade.",
    sellerId: "elise",
    distance: "1.2 mi away",
    postedAt: "1d ago",
  },
  {
    id: "knit",
    name: "Oversized Cream Knit",
    price: "$54",
    image: "/items/knit.png",
    category: "Tops",
    condition: "Like New",
    brand: "COS",
    size: "L",
    description: "Cozy oversized knit in warm cream. Heavyweight and beautifully textured.",
    sellerId: "mara",
    distance: "0.8 mi away",
    postedAt: "2d ago",
  },
  {
    id: "bag",
    name: "Burgundy Leather Bag",
    price: "$89",
    image: "/items/bag.png",
    category: "Accessories",
    condition: "New",
    brand: "Coach",
    size: "One Size",
    description: "Structured burgundy leather bag, never used. Comes with dust bag.",
    sellerId: "theo",
    distance: "2.0 mi away",
    postedAt: "3d ago",
  },
]

export function getItem(id: string) {
  return items.find((i) => i.id === id)
}

export function getSeller(id: string) {
  return sellers[id]
}

export interface Conversation {
  id: string
  sellerId: string
  itemId: string
  lastMessage: string
  time: string
  unread: number
}

export const conversations: Conversation[] = [
  { id: "c1", sellerId: "mara", itemId: "hero-jacket", lastMessage: "Sounds good! Want to meet this weekend?", time: "2m", unread: 2 },
  { id: "c2", sellerId: "elise", itemId: "dress", lastMessage: "Would you swap for the denim instead?", time: "1h", unread: 0 },
  { id: "c3", sellerId: "theo", itemId: "sneakers", lastMessage: "They're a true size 10, runs comfy.", time: "3h", unread: 0 },
]

export interface Message {
  id: string
  fromMe: boolean
  text: string
  time: string
}

export const messagesByConversation: Record<string, Message[]> = {
  c1: [
    { id: "m1", fromMe: false, text: "Hey! Still have the leather jacket?", time: "10:02" },
    { id: "m2", fromMe: true, text: "Yes it's available! Are you interested in a swap?", time: "10:05" },
    { id: "m3", fromMe: false, text: "Definitely. I have a wool coat I could trade.", time: "10:06" },
    { id: "m4", fromMe: false, text: "Sounds good! Want to meet this weekend?", time: "10:08" },
  ],
  c2: [
    { id: "m1", fromMe: false, text: "Hi! Loving the midi dress.", time: "09:20" },
    { id: "m2", fromMe: false, text: "Would you swap for the denim instead?", time: "09:21" },
  ],
  c3: [
    { id: "m1", fromMe: true, text: "What size are the sneakers?", time: "08:00" },
    { id: "m2", fromMe: false, text: "They're a true size 10, runs comfy.", time: "08:15" },
  ],
}

export interface AppNotification {
  id: string
  type: "swap" | "message" | "rating" | "like"
  sellerId: string
  text: string
  time: string
  unread: boolean
}

export const notifications: AppNotification[] = [
  { id: "n1", type: "swap", sellerId: "mara", text: "proposed a swap for your Leather Jacket", time: "2m", unread: true },
  { id: "n2", type: "like", sellerId: "elise", text: "liked your Oversized Cream Knit", time: "1h", unread: true },
  { id: "n3", type: "message", sellerId: "theo", text: "sent you a message", time: "3h", unread: false },
  { id: "n4", type: "rating", sellerId: "elise", text: "left you a 5-star review", time: "1d", unread: false },
]
