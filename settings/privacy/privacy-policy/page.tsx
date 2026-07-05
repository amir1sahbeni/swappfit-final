"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <header className="sticky top-0 z-40 -mx-5 mb-4 flex items-center gap-3 border-b border-border bg-card/85 px-5 py-3.5 backdrop-blur-xl">
        <button
          aria-label="Go back"
          onClick={() => router.replace('/settings/privacy')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground">Privacy Policy</h1>
          <p className="truncate text-xs text-muted-foreground">How we handle your data</p>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Last Updated: June 2026</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. Data Collection</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            SwappFit collects the following data to provide and improve our services:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, profile photo</li>
            <li><strong>Profile Data:</strong> Username, bio, location, rating and review information</li>
            <li><strong>Listing Content:</strong> Item photos, descriptions, brand, size, condition, pricing</li>
            <li><strong>Messages:</strong> Chat conversations with other users</li>
            <li><strong>Transaction Data:</strong> Swap proposals, exchange history, reviews</li>
            <li><strong>Device Information:</strong> IP address, device type, browser information for security purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. Data Usage</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            We use your data for the following purposes:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Matching you with nearby listings and potential swap partners</li>
            <li>Account security</li>
            <li>Sending notifications about messages, swap proposals, and account activity</li>
            <li>Platform safety and fraud prevention</li>
            <li>Improving our services and user experience</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. Data Sharing</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            SwappFit does not sell your personal data to third parties. We only share data in the following circumstances:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li><strong>Supabase Infrastructure:</strong> Your data is stored and processed through Supabase, our database and authentication provider, as necessary for service delivery</li>
            <li><strong>Other Users:</strong> Your profile information (name, username, location, ratings) is visible to other users on the platform. Your messages are shared with conversation participants</li>
            <li><strong>Legal Requirements:</strong> We may disclose data if required by law or to protect our rights and safety</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. User Rights</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            You have the following rights regarding your data:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li><strong>Access:</strong> View your profile data and activity through the app</li>
            <li><strong>Correction:</strong> Update your profile information at any time</li>
            <li><strong>Deletion:</strong> Request account deletion through the "Delete Account" option in Privacy & Security settings</li>
            <li><strong>Data Export:</strong> Download your data using the "Download My Data" feature in Privacy & Security settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. Cookies and Local Storage</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            SwappFit uses cookies and localStorage for:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Language preference settings</li>
            <li>Search history for quick access</li>
            <li>Theme (dark/light mode) preferences</li>
            <li>Authentication session management</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">6. Data Retention</h2>
          <p className="text-sm leading-relaxed text-foreground">
            When you request account deletion, your data will be permanently deleted from our servers within 30 days of the request. This includes your profile, listings, messages, and all associated data. Some data may be retained in backup systems for security purposes but will not be accessible or used.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">7. Data Security</h2>
          <p className="text-sm leading-relaxed text-foreground">
            SwappFit implements industry-standard security measures to protect your data, including encryption, secure authentication, and regular security audits. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">8. Children's Privacy</h2>
          <p className="text-sm leading-relaxed text-foreground">
            SwappFit is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a child under 18, we will take steps to delete such information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">9. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-foreground">
            We may update this privacy policy from time to time. We will notify users of significant changes by posting the new policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">10. Governing Law</h2>
          <p className="text-sm leading-relaxed text-foreground">
            This privacy policy is governed by the laws of Tunisia. Any disputes regarding data handling will be resolved in accordance with Tunisian data protection regulations and the jurisdiction of Tunisian courts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">11. Contact Information</h2>
          <p className="text-sm leading-relaxed text-foreground">
            For data requests, privacy concerns, or questions about this policy, please contact SwappFit support through the Help Center in the app or email privacy@swappfit.com
          </p>
        </section>
      </div>
    </main>
  )
}
