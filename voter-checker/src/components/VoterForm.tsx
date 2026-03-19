'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

interface VoterFormProps {
  onSearch: (epicNumber: string, state: string, captchaText: string, captchaId: string) => void
  loading: boolean
}

export default function VoterForm({ onSearch, loading }: VoterFormProps) {
  const { t } = useLanguage()
  const [epicNumber, setEpicNumber] = useState('')
  const [state, setState] = useState('Maharashtra')
  const [captchaText, setCaptchaText] = useState('')
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [captchaId, setCaptchaId] = useState<string | null>(null)
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)
  const [captchaTimestamp, setCaptchaTimestamp] = useState<number | null>(null)

  const fetchCaptcha = async (retryCount = 0, maxRetries = 2) => {
    setLoadingCaptcha(true)
    setCaptchaText('') // Clear previous CAPTCHA text

    try {
      // Add cache-busting timestamp to prevent caching
      const response = await fetch(`/api/generate-captcha?t=${Date.now()}&retry=${retryCount}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      })

      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.captcha && data.id) {
        setCaptchaImage(data.captcha)
        setCaptchaId(data.id)
        setCaptchaTimestamp(Date.now())
        console.log('CAPTCHA loaded successfully:', data.id)
      } else {
        throw new Error(data.error || 'Failed to generate CAPTCHA')
      }
    } catch (error: any) {
      console.error(`CAPTCHA fetch error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error)
      
      // Auto-retry on failure (up to maxRetries)
      if (retryCount < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return fetchCaptcha(retryCount + 1, maxRetries)
      }
      
      // Show user-friendly error message after all retries failed
      const errorMessage = error.message || 'Error generating CAPTCHA'
      console.error('CAPTCHA generation failed after retries:', errorMessage)
      
      // Set error state instead of alert
      setCaptchaImage(null)
      setCaptchaId(null)
      
      // Show error in console and let user manually retry
      // Don't use alert - it's too intrusive
    } finally {
      setLoadingCaptcha(false)
    }
  }

  useEffect(() => {
    fetchCaptcha()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!epicNumber || !captchaText || !captchaId) {
      alert(t('voterForm.fillAllFields'))
      return
    }
    onSearch(epicNumber, state, captchaText, captchaId)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('voterForm.epicNumber')}
          </label>
          <input
            type="text"
            value={epicNumber}
            onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
            placeholder={t('voterForm.epicPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('voterForm.state')}
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Kerala">Kerala</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Telangana">Telangana</option>
            <option value="Bihar">Bihar</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Haryana">Haryana</option>
            <option value="Assam">Assam</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Goa">Goa</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">
              {t('voterForm.captcha')}
            </label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {captchaImage ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={`data:image/jpeg;base64,${captchaImage}`}
                    alt="CAPTCHA"
                    className="w-full h-20 object-contain"
                  />
                </div>
              ) : loadingCaptcha ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 h-20 flex items-center justify-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    {t('voterForm.loadingCaptcha')}
                  </span>
                </div>
              ) : (
                <div className="border border-red-300 rounded-lg p-4 bg-red-50 h-20 flex flex-col items-center justify-center gap-2">
                  <span className="text-red-600 text-sm font-medium">{t('voterForm.failedToLoad')}</span>
                  <button
                    type="button"
                    onClick={() => fetchCaptcha()}
                    className="text-xs text-red-700 hover:text-red-900 underline"
                  >
                    {t('voterForm.clickToRetry')}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchCaptcha()}
              disabled={loadingCaptcha}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-black"
            >
              {loadingCaptcha ? '⏳' : '🔄'} {loadingCaptcha ? t('common.loading') : t('common.refresh')}
            </button>
          </div>
          <input
            type="text"
            value={captchaText}
            onChange={(e) => setCaptchaText(e.target.value.toLowerCase())}
            placeholder={t('voterForm.enterCaptcha')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2 text-gray-900 placeholder-gray-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || loadingCaptcha}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? t('voterForm.searching') : t('voterForm.searchVoterDetails')}
        </button>
      </form>
    </div>
  )
}

