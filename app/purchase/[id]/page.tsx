import { notFound, redirect } from "next/navigation"
import { getPurchaseById } from "@/lib/queries/purchases"
import { createServerClient } from "@/lib/supabase/server"
import { PurchaseView } from "./purchase-view"

export const dynamic = "force-dynamic"

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const purchase = await getPurchaseById(id)
  if (!purchase) notFound()

  // Verify authorization - must be buyer or seller
  if (purchase.buyer_id !== user.id && purchase.seller_id !== user.id) {
    redirect("/")
  }

  const isSeller = purchase.seller_id === user.id
  const partner = isSeller ? purchase.buyer : purchase.seller

  if (!partner) {
    console.error('Partner profile not found for purchase:', purchase.id)
    notFound()
  }

  return <PurchaseView purchase={purchase} partner={partner} isSeller={isSeller} />
}
