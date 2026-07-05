"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TermsPage() {
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
          <h1 className="truncate text-lg font-bold text-foreground">Terms & Conditions</h1>
          <p className="truncate text-xs text-muted-foreground">SwappFit platform terms</p>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Last Updated: June 2026</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. Eligibility</h2>
          <p className="text-sm leading-relaxed text-foreground">
            By using SwappFit, you confirm that you are at least 18 years old or have obtained parental consent to use the platform. You must verify your account to participate in transactions. Users under 18 must have explicit parental or guardian consent and supervision for all activities on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. User Responsibilities</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            As a SwappFit user, you agree to:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Create accurate and honest listings with true descriptions of item condition, brand, size, and any defects</li>
            <li>Upload clear, representative photos that accurately depict the items being listed</li>
            <li>Honor agreed-upon meetup times and locations for in-person exchanges</li>
            <li>Communicate respectfully and professionally with other users</li>
            <li>Report any suspicious activity or violations of these terms to SwappFit support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. Prohibited Items</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            The following items are strictly prohibited on SwappFit:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Counterfeit or fake branded goods and replicas</li>
            <li>Stolen items or items of questionable origin</li>
            <li>Non-clothing items unless explicitly agreed upon by both parties in a swap</li>
            <li>Items that violate local laws or regulations</li>
            <li>Hazardous materials or items that pose safety risks</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. Platform Role</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            SwappFit serves as a facilitation platform only. We are not responsible for:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Transaction disputes between users</li>
            <li>Disagreements about item condition or description</li>
            <li>Meetup safety or incidents during in-person exchanges</li>
            <li>The quality, authenticity, or condition of items listed on the platform</li>
            <li>Any financial losses resulting from user interactions</li>
          </ul>
          <p className="text-sm leading-relaxed text-foreground mt-3">
            All transactions are conducted cash-in-person directly between users. SwappFit does not handle payments, escrow services, or transaction processing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. Listing Rules</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            Users must adhere to the following listing guidelines:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Users are limited to 5 listings per day</li>
            <li>All listings must include accurate photos and descriptions</li>
            <li>Misleading photos or descriptions are grounds for account suspension</li>
            <li>Items must be available for swap or sale at the listed price</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">6. Account Termination</h2>
          <p className="text-sm leading-relaxed text-foreground mb-3">
            SwappFit reserves the right to suspend or terminate accounts that:
          </p>
          <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-2">
            <li>Violate these terms of service</li>
            <li>Engage in fraudulent or deceptive practices</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>List prohibited items repeatedly</li>
            <li>Fail to honor transaction commitments</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">7. Governing Law</h2>
          <p className="text-sm leading-relaxed text-foreground">
            These terms are governed by the laws of Tunisia. Any disputes arising from the use of SwappFit shall be resolved in accordance with Tunisian law and the jurisdiction of Tunisian courts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">8. Contact</h2>
          <p className="text-sm leading-relaxed text-foreground">
            For questions about these terms, please contact SwappFit support through the Help Center in the app.
          </p>
        </section>
      </div>
    </main>
  )
}
