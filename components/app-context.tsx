"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
export type Language = "en" | "fr" | "ar"

export interface NotificationSettings {
  muteAll: boolean
  newMessages: boolean
  swapProposals: boolean
  itemLikes: boolean
  swapAccepted: boolean
  newReviews: boolean
}

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  notificationSettings: NotificationSettings
  setNotificationSettings: (settings: NotificationSettings | ((prev: NotificationSettings) => NotificationSettings)) => void
  listingsCreatedToday: number
  incrementListingsCreated: () => void
}

const defaultNotificationSettings: NotificationSettings = {
  muteAll: false,
  newMessages: false,
  swapProposals: false,
  itemLikes: false,
  swapAccepted: false,
  newReviews: false,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Use lazy initialization for state based on localStorage if available
  const [language, setLanguageState] = useState<Language>("en")
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(defaultNotificationSettings)
  const [listingsCreatedToday, setListingsCreatedTodayState] = useState(0)

  useEffect(() => {
    // Client-side only init
    const storedLang = localStorage.getItem("swappfit_lang") as Language
    if (storedLang) setLanguageState(storedLang)
      
    const storedNotifs = localStorage.getItem("swappfit_notifs")
    if (storedNotifs) {
      try {
        setNotificationSettingsState(JSON.parse(storedNotifs))
      } catch (e) {}
    }
    
    const storedListings = localStorage.getItem("swappfit_listings_today")
    const storedListingsDate = localStorage.getItem("swappfit_listings_date")
    const today = new Date().toDateString()
    
    if (storedListingsDate === today && storedListings) {
      setListingsCreatedTodayState(parseInt(storedListings, 10))
    } else {
      localStorage.setItem("swappfit_listings_date", today)
      localStorage.setItem("swappfit_listings_today", "0")
    }
    
    setMounted(true)
  }, [])

  // Sync to local storage & DOM
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("swappfit_lang", lang)
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`
    router.refresh()
  }

  const setNotificationSettings = (val: NotificationSettings | ((prev: NotificationSettings) => NotificationSettings)) => {
    setNotificationSettingsState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val
      localStorage.setItem("swappfit_notifs", JSON.stringify(next))
      return next
    })
  }

  const incrementListingsCreated = () => {
    const next = listingsCreatedToday + 1
    setListingsCreatedTodayState(next)
    localStorage.setItem("swappfit_listings_today", String(next))
  }

  // Effect to manage RTL
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    }
  }, [language, mounted])

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        notificationSettings,
        setNotificationSettings,
        listingsCreatedToday,
        incrementListingsCreated,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
