"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, User, ArrowRight, Loader2, MapPin, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'

const TUNISIAN_GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "Manouba", "Médenine",
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine",
  "Tozeur", "Tunis", "Zaghouan"
]

export default function AuthPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [governorate, setGovernorate] = useState("")
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Modal state for Terms & Privacy Policy popups
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/'
  const infoMessage = searchParams.get('message') || ''

  const isLogin = mode === "login"

  // If the user is already logged in (client-side check), redirect them away
  // immediately. This breaks any server-side false-negative redirect loop.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(redirectTo)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show info message from redirect (e.g. "Sign in to create a listing")
  useEffect(() => {
    if (infoMessage) {
      setError(infoMessage)
    }
  }, [infoMessage])

  // Lock body scroll when a modal is open
  useEffect(() => {
    if (termsOpen || privacyOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [termsOpen, privacyOpen])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password || (!isLogin && (!name || !governorate || !city))) {
      setError(t('fillAllFields'))
      return
    }

    if (password.length < 8) {
      setError(t('passwordMinLength'))
      return
    }

    if (!isLogin && !agreedToTerms) {
      setError(t('mustAgreeToTerms'))
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Redirect back to original destination after successful login
        router.replace(redirectTo)
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const emailRedirectTo = `${siteUrl}${redirectTo !== '/' ? redirectTo : ''}`

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              governorate,
              city,
            },
            emailRedirectTo,
          },
        })
        if (error) throw error

        // Persist terms agreement and location on the profile row
        if (data.user) {
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              agreed_to_terms_at: new Date().toISOString(),
              terms_version: '1.0',
              governorate: governorate,
              city: city
            })
        }

        if (data.user && !data.session) {
          setError(t('checkEmailConfirm'))
          return
        }

        // Redirect to the intended destination after signup
        router.replace(redirectTo)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function forgotPassword() {
    if (!email) {
      setError(t('enterEmailFirst'))
      return
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    })
    if (error) {
      setError(error.message)
    } else {
      setError(t('passwordResetSent'))
    }
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-5 py-8">
      {/* Brand */}
      <div className="relative z-10 w-full max-w-[360px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-card shadow-[0_8px_32px_rgba(192,57,91,0.12)]">
            <Image
              src="/swappfit-logo.png"
              alt="SwappFit logo"
              width={96}
              height={96}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Swapp<span className="bg-brand-gradient bg-clip-text text-transparent">Fit</span>
          </h1>
          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
            {t('swapPremiumFashion')}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card p-6 shadow-[0_8px_32px_rgba(192,57,91,0.10)]">
          <h2 className="text-lg font-bold text-foreground">{isLogin ? t('welcomeBack') : t('createAccount')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLogin ? t('loginToContinue') : t('joinCommunity')}
          </p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            {!isLogin && (
              <>
                <InputField icon={<User className="h-4 w-4" />}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('fullName')}
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    disabled={loading}
                  />
                </InputField>
                <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3.5 focus-within:ring-2 focus-within:ring-ring">
                  <span className="shrink-0 text-muted-foreground"><MapPin className="h-4 w-4" /></span>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    disabled={loading}
                  >
                    <option value="">{t('stateGovernorate')}</option>
                    {TUNISIAN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <InputField icon={<MapPin className="h-4 w-4" />}>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('city')}
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    disabled={loading}
                  />
                </InputField>
              </>
            )}
            <InputField icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                disabled={loading}
              />
            </InputField>
            <InputField icon={<Lock className="h-4 w-4" />}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                disabled={loading}
              />
            </InputField>

            {/* Terms & Conditions checkbox — signup only */}
            {!isLogin && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted px-4 py-3.5">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {t.rich('agreeToTerms', {
                    termsLink: (chunks) => (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setTermsOpen(true) }}
                        className="font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {chunks}
                      </button>
                    ),
                    privacyLink: (chunks) => (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPrivacyOpen(true) }}
                        className="font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {chunks}
                      </button>
                    ),
                  })}
                </span>
              </label>
            )}

            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {isLogin && (
              <button
                type="button"
                onClick={forgotPassword}
                className="-mt-1 self-end text-xs font-semibold text-primary"
                disabled={loading}
              >
                {t('forgotPassword')}
              </button>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !agreedToTerms)}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? t('login') : t('signUp')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => {
            setMode(isLogin ? "signup" : "login")
            setError("")
            setAgreedToTerms(false)
          }}
          className="mt-5 w-full text-center text-sm text-muted-foreground transition-colors active:scale-95"
          disabled={loading}
        >
          {isLogin ? t('newHere') + " " : t('alreadyHaveAccount') + " "}
          <span className="font-bold text-primary">{isLogin ? t('createAccount') : t('login')}</span>
        </button>
      </div>

      {/* Terms & Conditions Modal */}
      {termsOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 sm:items-center"
          onClick={() => setTermsOpen(false)}
        >
          <div
            className="relative w-full max-w-[420px] max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-5 py-4 backdrop-blur-xl rounded-t-3xl sm:rounded-t-3xl">
              <div>
                <h2 className="text-base font-bold text-foreground">{t('termsAndConditions')}</h2>
                <p className="text-[11px] text-muted-foreground">SwappFit platform terms</p>
              </div>
              <button
                aria-label={t('close')}
                onClick={() => setTermsOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-8 pt-5 space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Last Updated: June 2026</p>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">1. Eligibility</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  By using SwappFit, you confirm that you are at least 18 years old or have obtained parental consent to use the platform. You must verify your account to participate in transactions. Users under 18 must have explicit parental or guardian consent and supervision for all activities on the platform.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">2. User Responsibilities</h3>
                <p className="text-sm leading-relaxed text-foreground mb-2">As a SwappFit user, you agree to:</p>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li>Create accurate and honest listings with true descriptions of item condition, brand, size, and any defects</li>
                  <li>Upload clear, representative photos that accurately depict the items being listed</li>
                  <li>Honor agreed-upon meetup times and locations for in-person exchanges</li>
                  <li>Communicate respectfully and professionally with other users</li>
                  <li>Report any suspicious activity or violations of these terms to SwappFit support</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">3. Prohibited Items</h3>
                <p className="text-sm leading-relaxed text-foreground mb-2">The following items are strictly prohibited on SwappFit:</p>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li>Counterfeit or fake branded goods and replicas</li>
                  <li>Stolen items or items of questionable origin</li>
                  <li>Non-clothing items unless explicitly agreed upon by both parties in a swap</li>
                  <li>Items that violate local laws or regulations</li>
                  <li>Hazardous materials or items that pose safety risks</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">4. Platform Role</h3>
                <p className="text-sm leading-relaxed text-foreground mb-2">SwappFit serves as a facilitation platform only. We are not responsible for:</p>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
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
                <h3 className="text-sm font-bold text-foreground mb-2">5. Listing Rules</h3>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li>Users are limited to 5 listings per day</li>
                  <li>All listings must include accurate photos and descriptions</li>
                  <li>Misleading photos or descriptions are grounds for account suspension</li>
                  <li>Items must be available for swap or sale at the listed price</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">6. Account Termination</h3>
                <p className="text-sm leading-relaxed text-foreground mb-2">SwappFit reserves the right to suspend or terminate accounts that:</p>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li>Violate these terms of service</li>
                  <li>Engage in fraudulent or deceptive practices</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>List prohibited items repeatedly</li>
                  <li>Fail to honor transaction commitments</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">7. Governing Law</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  These terms are governed by the laws of Tunisia. Any disputes arising from the use of SwappFit shall be resolved in accordance with Tunisian law and the jurisdiction of Tunisian courts.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">8. Contact</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  For questions about these terms, please contact SwappFit support through the Help Center in the app.
                </p>
              </section>

              <button
                onClick={() => setTermsOpen(false)}
                className="w-full flex h-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(192,57,91,0.28)] transition-transform active:scale-95"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {privacyOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 sm:items-center"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="relative w-full max-w-[420px] max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-5 py-4 backdrop-blur-xl rounded-t-3xl sm:rounded-t-3xl">
              <div>
                <h2 className="text-base font-bold text-foreground">{t('privacyPolicy')}</h2>
                <p className="text-[11px] text-muted-foreground">How we handle your data</p>
              </div>
              <button
                aria-label={t('close')}
                onClick={() => setPrivacyOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-8 pt-5 space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Last Updated: June 2026</p>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">1. Data Collection</h3>
                <p className="text-sm leading-relaxed text-foreground mb-2">SwappFit collects the following data to provide and improve our services:</p>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li><strong>Account Information:</strong> Name, email address, phone number, profile photo</li>
                  <li><strong>Profile Data:</strong> Username, bio, location, rating and review information</li>
                  <li><strong>Listing Content:</strong> Item photos, descriptions, brand, size, condition, pricing</li>
                  <li><strong>Messages:</strong> Chat conversations with other users</li>
                  <li><strong>Transaction Data:</strong> Swap proposals, exchange history, reviews</li>
                  <li><strong>Device Information:</strong> IP address, device type, browser information for security purposes</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">2. Data Usage</h3>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li>Matching you with nearby listings and potential swap partners</li>
                  <li>Account security</li>
                  <li>Sending notifications about messages, swap proposals, and account activity</li>
                  <li>Platform safety and fraud prevention</li>
                  <li>Improving our services and user experience</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">3. Data Sharing</h3>
                <p className="text-sm leading-relaxed text-foreground mb-2">SwappFit does not sell your personal data to third parties. We only share data in the following circumstances:</p>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li><strong>Supabase Infrastructure:</strong> Your data is stored and processed through Supabase, our database and authentication provider, as necessary for service delivery</li>
                  <li><strong>Other Users:</strong> Your profile information (name, username, location, ratings) is visible to other users on the platform. Your messages are shared with conversation participants</li>
                  <li><strong>Legal Requirements:</strong> We may disclose data if required by law or to protect our rights and safety</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">4. User Rights</h3>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li><strong>Access:</strong> View your profile data and activity through the app</li>
                  <li><strong>Correction:</strong> Update your profile information at any time</li>
                  <li><strong>Deletion:</strong> Request account deletion through the &quot;Delete Account&quot; option in Privacy &amp; Security settings</li>
                  <li><strong>Data Export:</strong> Download your data using the &quot;Download My Data&quot; feature in Privacy &amp; Security settings</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">5. Cookies and Local Storage</h3>
                <ul className="text-sm leading-relaxed text-foreground list-disc list-inside space-y-1.5">
                  <li>Language preference settings</li>
                  <li>Search history for quick access</li>
                  <li>Theme (dark/light mode) preferences</li>
                  <li>Authentication session management</li>
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">6. Data Retention</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  When you request account deletion, your data will be permanently deleted from our servers within 30 days of the request. This includes your profile, listings, messages, and all associated data. Some data may be retained in backup systems for security purposes but will not be accessible or used.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">7. Data Security</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  SwappFit implements industry-standard security measures to protect your data, including encryption, secure authentication, and regular security audits. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">8. Children&apos;s Privacy</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  SwappFit is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected data from a child under 18, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">9. Changes to This Policy</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  We may update this privacy policy from time to time. We will notify users of significant changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">10. Governing Law</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  This privacy policy is governed by the laws of Tunisia. Any disputes regarding data handling will be resolved in accordance with Tunisian data protection regulations and the jurisdiction of Tunisian courts.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-foreground mb-2">11. Contact Information</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  For data requests, privacy concerns, or questions about this policy, please contact SwappFit support through the Help Center in the app or email privacy@swappfit.com
                </p>
              </section>

              <button
                onClick={() => setPrivacyOpen(false)}
                className="w-full flex h-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(192,57,91,0.28)] transition-transform active:scale-95"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function InputField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3.5 focus-within:ring-2 focus-within:ring-ring">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      {children}
    </div>
  )
}
