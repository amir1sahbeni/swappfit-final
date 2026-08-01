import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  url: string
) {
  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single()

  if (!sub) return

  try {
    await webpush.sendNotification(
      JSON.parse(sub.subscription),
      JSON.stringify({ title, body, url })
    )
  } catch (err: any) {
    if (err.statusCode === 410) {
      // Subscription expired — delete it
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
    }
  }
}
