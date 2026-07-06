"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, User, ArrowRight, Loader2, MapPin } from "lucide-react"
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

  const redirectTo = searchParams.get('redirect') || '/'
  const infoMessage = searchParams.get('message') || ''

  const isLogin = mode === "login"

  // Show info message from redirect (e.g. "Sign in to create a listing")
  useEffect(() => {
    if (infoMessage) {
      setError(infoMessage)
    }
  }, [infoMessage])

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
              disabled={loading}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
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
          }}
          className="mt-5 w-full text-center text-sm text-muted-foreground transition-colors active:scale-95"
          disabled={loading}
        >
          {isLogin ? t('newHere') + " " : t('alreadyHaveAccount') + " "}
          <span className="font-bold text-primary">{isLogin ? t('createAccount') : t('login')}</span>
        </button>
      </div>
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
