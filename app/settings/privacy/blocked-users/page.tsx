import { createServerClient } from "@/lib/supabase/server"
import { getBlockedUsers } from "@/lib/queries/blocks"
import { unblockUser } from "@/app/actions/blocks"
import { redirect, RedirectType } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"

export default async function BlockedUsersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const blockedUsers = await getBlockedUsers(user.id)

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background pb-10">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-background/80 px-5 backdrop-blur-md">
        <Link href="/settings/privacy" replace className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Blocked Users</h1>
      </header>

      <div className="px-5 mt-4 space-y-4">
        {blockedUsers.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-10">You haven't blocked any users.</p>
        ) : (
          blockedUsers.map((profile) => (
            <div key={profile.id} className="flex items-center gap-4 bg-card p-3 rounded-2xl shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
              <Image src={profile.avatar_url || "/placeholder.svg"} width={48} height={48} className="rounded-full object-cover" alt={profile.name} />
              <div className="flex-1">
                <p className="font-bold text-foreground">{profile.name}</p>
                <p className="text-sm text-muted-foreground">@{profile.handle?.replace('@', '') || profile.handle}</p>
              </div>
              <form action={async () => {
                "use server"
                await unblockUser(user.id, profile.id)
                redirect("/settings/privacy/blocked-users", RedirectType.replace)
              }}>
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition-transform active:scale-95"
                >
                  Unblock
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
