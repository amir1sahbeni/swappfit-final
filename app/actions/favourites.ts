"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleFavourite(listingId: string, isFavourite: boolean) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Must be logged in to favourite")

  if (isFavourite) {
    const { error } = await supabase
      .from('favourites')
      .insert({ user_id: user.id, listing_id: listingId })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('favourites')
      .delete()
      .match({ user_id: user.id, listing_id: listingId })
    if (error) throw error
  }

  revalidatePath('/')
  revalidatePath('/favourites')
  revalidatePath(`/item/${listingId}`)
}
