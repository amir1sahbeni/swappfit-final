"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Camera, Plus, Check, Loader2, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { categories } from "@/lib/data"
import { updateListing } from "@/app/actions/listings"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'
import { compressImage } from "@/lib/utils/compressImage"

const MAX_PHOTOS = 5
const conditions = ["New", "Like New", "Excellent", "Good", "Fair"]
const formCategories = categories.filter((c) => c !== "All")

export default function EditListingPage() {
  const t = useTranslations('Create')
  const tColors = useTranslations('Colors')
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Tops")
  const [color, setColor] = useState("")
  const [condition, setCondition] = useState("Like New")
  
  // We'll keep things simple: we show existing photos. If they want to change them,
  // they'll have to delete and re-upload, but for now we won't handle complex photo reordering.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'updating'>('idle')
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchListing() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth')
        return
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('seller_id', user.id)
        .single()

      if (error || !data) {
        router.replace('/')
        return
      }

      setName(data.name)
      setBrand(data.brand || "")
      setSize(data.size || "")
      setPrice((data.price / 100).toString())
      setDescription(data.description || "")
      setCategory(data.category)
      setCondition(data.condition)
      setColor(data.color || "")
      setIsLoading(false)
    }
    fetchListing()
  }, [listingId, supabase, router])

  const canSubmit = name.trim() && price.trim() && !isSubmitting

  const handlePublishClick = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setSubmitStatus('updating')
    setError("")

    try {
      await updateListing(listingId, {
        name,
        brand,
        size,
        price,
        description,
        category,
        condition,
        color
      })
      router.replace(`/item/${listingId}`)
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
      setSubmitStatus('idle')
    }
  }

  const getSizes = (cat: string) => {
    if (cat === "Shoes") return ["Kids (Under 35)", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"]
    if (cat === "Trousers" || cat === "Bottoms") {
      return ["Kids", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50"]
    }
    if (cat === "Accessories") return ["One Size", "Adjustable", "XS", "S", "M", "L", "XL"]
    return ["Kids", "XS", "S", "M", "L", "XL", "XXL", "3XL"]
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      <PageHeader title={t('editListing')} subtitle={t('subtitle')} />

      {/* Fields */}
      <div className="mt-6 flex flex-col gap-5">
        <Field label={t('itemName')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('placeholderItemName')}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label={t('brand')}>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t('placeholderBrand')}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label={t('category')}>
          <div className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
            {formCategories.map((cat) => (
              <Chip key={cat} active={cat === category} onClick={() => { setCategory(cat); setSize(""); }}>
                {cat}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t('color')}>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none border-r-8 border-transparent focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>{t('placeholderColor')}</option>
            {['Black', 'White', 'Gray', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Brown', 'Beige', 'Navy', 'Multicolor'].map(c => (
              <option key={c} value={c}>{tColors(c as any)}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('size')}>
            {category === "Accessories" ? (
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. Adjustable"
                className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            ) : (
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none border-r-8 border-transparent"
              >
                <option value="" disabled>Select Size</option>
                {getSizes(category).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label={t('estimatedValue')}>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t('placeholderPrice')}
              inputMode="numeric"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </Field>
        </div>

        <Field label={t('condition')}>
          <div className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
            {conditions.map((c) => (
              <Chip key={c} active={c === condition} onClick={() => setCondition(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t('description')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t('placeholderDescription')}
            className="w-full resize-none rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Submit */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
        <button
          disabled={!canSubmit}
          onClick={handlePublishClick}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('updating', { fallback: 'Updating...' })}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {t('updateListing', { fallback: 'Update Listing' })}
            </>
          )}
        </button>
      </div>

    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
        active
          ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
          : "border border-secondary bg-transparent text-foreground"
      }`}
    >
      {children}
    </button>
  )
}
