"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Plus, Check, Loader2, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { categories } from "@/lib/data"
import { createListing } from "@/app/actions/listings"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context"
import { AlertCircle, PlayCircle } from "lucide-react"
import { useTranslations } from 'next-intl'

const MAX_PHOTOS = 5
const conditions = ["New", "Like New", "Excellent", "Good", "Fair"]
const formCategories = categories.filter((c) => c !== "All")

export default function CreateListingPage() {
  const t = useTranslations('Create')
  const tAuth = useTranslations('Auth')
  const router = useRouter()
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Tops")
  const [condition, setCondition] = useState("Like New")
  
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [photoError, setPhotoError] = useState("")

  const { incrementListingsCreated } = useAppContext()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Server-side backup: redirect unauthenticated users
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth?redirect=/create')
      }
    }
    checkAuth()
  }, [])

  const atPhotoLimit = files.length >= MAX_PHOTOS
  const canSubmit = name.trim() && price.trim() && files.length > 0 && !isSubmitting

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError("")
    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0]
      
      if (files.length >= MAX_PHOTOS) {
        setPhotoError(t('photoLimitError'))
        // Reset input so user can try again after removing a photo
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      
      setFiles(prev => [...prev, newFile])
      const newUrl = URL.createObjectURL(newFile)
      setPreviewUrls(prev => [...prev, newUrl])
    }
    // Always reset the input value so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = (index: number) => {
    setPhotoError("")
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      const urls = [...prev]
      URL.revokeObjectURL(urls[index])
      urls.splice(index, 1)
      return urls
    })
  }

  const handlePublishClick = () => {
    if (!canSubmit) return
    executeSubmit()
  }

  const getSizes = (cat: string) => {
    if (cat === "Shoes") return ["Kids (Under 35)", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"]
    if (cat === "Trousers" || cat === "Bottoms") {
      return ["Kids", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50"]
    }
    if (cat === "Accessories") return ["One Size", "Adjustable", "XS", "S", "M", "L", "XL"]
    return ["Kids", "XS", "S", "M", "L", "XL", "XXL", "3XL"]
  }

  const executeSubmit = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      // 1. Upload images
      const uploadedUrls: string[] = []
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { data, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })
          
        if (uploadError) throw uploadError
        
        const { data: publicUrlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName)
          
        uploadedUrls.push(publicUrlData.publicUrl)
      }

      // 2. Create listing
      const sizeType = (category === "Trousers" || category === "Bottoms") 
          ? "mixed"
          : (category === "Shoes" ? "numeric" : "letter")
          
      await createListing({
        name,
        brand,
        size,
        price,
        description,
        category,
        condition,
        images: uploadedUrls,
        size_type: sizeType,
        gender: undefined
      })
      incrementListingsCreated()
      router.replace('/')
    } catch (err: any) {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Photos */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('photos')}</p>
      
      {/* Photo counter */}
      <p className={`mt-1 text-[11px] font-medium ${atPhotoLimit ? 'text-primary' : 'text-muted-foreground'}`}>
        {atPhotoLimit ? t('photoLimitReached') : t('photoCounter', { count: files.length })}
      </p>

      <div className="mt-3 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {previewUrls.map((url, i) => (
          <div key={url} className="relative shrink-0">
            <img src={url} alt="Preview" className="aspect-square w-24 rounded-2xl object-cover border border-border" />
            <button
              onClick={() => removeFile(i)}
              aria-label={t('removePhoto')}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-transform active:scale-90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add photo button — hidden when at limit */}
        {!atPhotoLimit && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 flex aspect-square w-24 flex-col items-center justify-center gap-1 rounded-2xl bg-muted text-muted-foreground transition-transform active:scale-95"
          >
            <Camera className="h-6 w-6" />
            <span className="text-[11px] font-medium">{t('add')}</span>
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple={false}
          onChange={handleFileChange}
        />
      </div>

      {/* Photo error */}
      {photoError && (
        <p className="mt-1.5 text-xs text-destructive">{photoError}</p>
      )}

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
              {t('publishing')}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {t('publishListing')}
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
