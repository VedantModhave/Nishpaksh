'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import enTranslations from '@/locales/en.json'
import hiTranslations from '@/locales/hi.json'
import mrTranslations from '@/locales/mr.json'

type Language = 'en' | 'hi' | 'mr'

type Translations = typeof enTranslations

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, ...args: string[]) => string
  languageCode: 'en' | 'hi' | 'mr'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
        setLanguageState(savedLanguage)
      }
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  // Translation function with nested key support and placeholder replacement
  const t = (key: string, ...args: string[]): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English if translation not found
        value = translations.en
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }
    
    if (typeof value === 'string') {
      // Replace placeholders {0}, {1}, etc. with provided arguments
      return args.reduce((text, arg, index) => {
        return text.replace(`{${index}}`, arg)
      }, value)
    }
    
    return key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageCode: language }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

