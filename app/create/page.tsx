"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Plus, Check, Loader2, X, ChevronDown } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { CATEGORIES, GENDER_FILTERS } from "@/lib/constants"
import { createListing } from "@/app/actions/listings"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/components/app-context"
import { AlertCircle, PlayCircle } from "lucide-react"
import { useTranslations } from 'next-intl'
import { compressImage } from "@/lib/utils/compressImage"

const MAX_PHOTOS = 5
const conditions = ["New", "Like New", "Excellent", "Good", "Fair"]

const STANDARD_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Multicolor', hex: 'conic-gradient(red, yellow, green, blue, purple, red)' }
] as const;

export default function CreateListingPage() {
  const t = useTranslations('Create')
  const tAuth = useTranslations('Auth')
  const tColors = useTranslations('Colors')
  const tGender = useTranslations('Gender')
  const router = useRouter()
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("tops")
  const [gender, setGender] = useState("women")
  const [color, setColor] = useState("")
  const [isColorOpen, setIsColorOpen] = useState(false)
  const [condition, setCondition] = useState("Like New")
  
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'compressing' | 'uploading' | 'publishing'>('idle')

  const { incrementListingsCreated } = useAppContext()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Server-side backup: redirect unauthenticated users
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth?redirect=/create')
      } else {
        const { data: profile } = await supabase.from('profiles').select('location_sharing_enabled').eq('id', user.id).single()
        if (profile?.location_sharing_enabled) {
          setLocationSharingEnabled(true)
        }
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
    if (cat === "shoes") return ["Kids (Under 35)", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"]
    if (cat === "bottoms") {
      return ["Kids", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50"]
    }
    if (cat === "accessories" || cat === "bags" || cat === "watches") return ["One Size", "Adjustable", "XS", "S", "M", "L", "XL"]
    return ["Kids", "XS", "S", "M", "L", "XL", "XXL", "3XL"]
  }

  const executeSubmit = async () => {
    setIsSubmitting(true)
    setSubmitStatus('compressing')
    setError("")

    try {
      // 1. Upload images
      const uploadedUrls: string[] = []
      
      for (const file of files) {
        const compressedFile = await compressImage(file, 1200, 1200, 0.75)
        setSubmitStatus('uploading')

        const fileExt = compressedFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { data, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false })
          
        if (uploadError) throw uploadError
        
        const { data: publicUrlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName)
          
        uploadedUrls.push(publicUrlData.publicUrl)
      }

      // 2. Get live location if enabled
      let lat: number | null = null
      let lng: number | null = null
      
      if (locationSharingEnabled && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 })
          })
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch (e) {
          console.warn("Could not get live location, falling back to profile coords", e)
        }
      }

      // 3. Create listing
      setSubmitStatus('publishing')
      const sizeType = (category === "bottoms") 
          ? "mixed"
          : (category === "shoes" ? "numeric" : "letter")
          
      await createListing({
        name,
        brand,
        size,
        price,
        description,
        category,
        condition,
        color,
        images: uploadedUrls,
        size_type: sizeType,
        gender,
        lat,
        lng
      })
      incrementListingsCreated()
      router.replace('/')
    } catch (err: any) {
      setIsSubmitting(false)
      setSubmitStatus('idle')
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

      <div className="mt-3 flex gap-4 overflow-x-auto hide-scrollbar pb-6 pl-2 pt-2">
        {previewUrls.length > 0 && (
          <div 
            className="relative shrink-0" 
            style={{ 
              width: previewUrls.length > 1 ? 96 + (previewUrls.length - 1) * 8 : 96, 
              height: 96 
            }}
          >
            {/* The stack */}
            {previewUrls.map((url, i) => (
              <div 
                key={url} 
                className="absolute top-0 left-0 transition-all" 
                style={{ 
                  transform: `translate(${i * 8}px, ${i * 8}px)`, 
                  zIndex: MAX_PHOTOS - i 
                }}
              >
                <img 
                  src={url} 
                  alt="Preview" 
                  className="aspect-square w-24 rounded-2xl object-cover border border-border bg-background shadow-sm" 
                />
                <button
                  onClick={(e) => { e.preventDefault(); removeFile(i); }}
                  aria-label={t('removePhoto')}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-transform active:scale-90 shadow-sm"
                  style={{ zIndex: 100 }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {previewUrls.length > 1 && (
              <div 
                className="absolute -bottom-3 left-0 z-[60] rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur"
                style={{ transform: `translateX(${((previewUrls.length - 1) * 8) / 2}px)` }}
              >
                {previewUrls.length} photos
              </div>
            )}
          </div>
        )}

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
            {CATEGORIES.map((cat) => (
              <Chip key={cat.value} active={cat.value === category} onClick={() => { setCategory(cat.value); setSize(""); }}>
                <span className="mr-1">{cat.emoji}</span>{cat.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={tGender('whoIsThisFor')}>
          <div className="flex gap-3">
            {GENDER_FILTERS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-transform active:scale-95 border ${
                  gender === g.value
                    ? "bg-primary text-white border-primary shadow-[0_4px_12px_rgba(192,57,91,0.25)]"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                <span>{g.emoji}</span>
                <span>{tGender(g.value as any)}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGender("unisex")}
              className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-transform active:scale-95 border ${
                gender === 'unisex'
                  ? "bg-primary text-white border-primary shadow-[0_4px_12px_rgba(192,57,91,0.25)]"
                  : "bg-muted text-muted-foreground border-transparent"
              }`}
            >
              {tGender('unisex')}
            </button>
          </div>
        </Field>

        <Field label={t('colorOptional')}>
          <div className="relative">
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setIsColorOpen(!isColorOpen); }}
              className={`w-full flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm outline-none border border-transparent focus:border-ring transition-colors ${color ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {color ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-5 w-5 rounded-full border border-border/50" 
                    style={{ background: STANDARD_COLORS.find(c => c.name === color)?.hex }} 
                  />
                  <span>{tColors(color as any)}</span>
                </div>
              ) : (
                <span>{t('placeholderColor')}</span>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
            
            {isColorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsColorOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-background border border-border shadow-lg p-2 max-h-60 overflow-y-auto">
                  <button 
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors"
                    onClick={(e) => { e.preventDefault(); setColor(""); setIsColorOpen(false); }}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-muted">
                      <X className="h-3 w-3" />
                    </div>
                    <span>{t('none')}</span>
                  </button>
                  
                  {STANDARD_COLORS.map(c => (
                    <button 
                      type="button"
                      key={c.name}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm transition-colors ${color === c.name ? 'bg-muted/50 font-medium text-foreground' : 'text-muted-foreground'}`}
                      onClick={(e) => { e.preventDefault(); setColor(c.name); setIsColorOpen(false); }}
                    >
                      <div 
                        className="h-5 w-5 rounded-full border border-border/50" 
                        style={{ background: c.hex }} 
                      />
                      <span>{tColors(c.name as any)}</span>
                      {color === c.name && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
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
              {submitStatus === 'compressing' ? t('optimizingImage', { fallback: 'Optimizing image...' }) : 
               submitStatus === 'uploading' ? t('uploading', { fallback: 'Uploading...' }) : 
               t('publishing', { fallback: 'Publishing...' })}
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
