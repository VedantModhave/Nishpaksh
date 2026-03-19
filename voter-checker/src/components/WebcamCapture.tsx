'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface WebcamCaptureProps {
  voterId: string
  fullName?: string
  mode: 'register' | 'verify'
  onComplete: (result: any) => void
  onError: (error: string) => void
}

export default function WebcamCapture({ voterId, fullName, mode, onComplete, onError }: WebcamCaptureProps) {
  const { t } = useLanguage()
  const [consentGiven, setConsentGiven] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [])

  // Check if video element has active stream (fallback detection)
  useEffect(() => {
    const checkVideoStream = () => {
      if (videoRef.current && videoRef.current.srcObject && !cameraActive) {
        const stream = videoRef.current.srcObject as MediaStream
        if (stream.active) {
          setCameraActive(true)
        }
      }
    }
    
    // Check periodically if camera is active but state isn't updated
    const interval = setInterval(checkVideoStream, 100)
    return () => clearInterval(interval)
  }, [cameraActive])

  const startCamera = async () => {
    try {
      setError(null)
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      console.log('Camera stream obtained:', stream.active)
      streamRef.current = stream
      
      // Wait a bit for React to render the video element if it doesn't exist yet
      let attempts = 0
      const maxAttempts = 10
      
      const attachStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log('Video srcObject set')
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
            setCameraActive(true)
          }
          
          videoRef.current.oncanplay = () => {
            console.log('Video can play')
            setCameraActive(true)
          }
          
          // Set active after a short delay to ensure video element is ready
          setTimeout(() => {
            if (videoRef.current && videoRef.current.srcObject) {
              setCameraActive(true)
            }
          }, 100)
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(attachStream, 50)
        } else {
          console.error('Video ref is null after multiple attempts')
          setError('Video element not found. Please refresh the page.')
        }
      }
      
      attachStream()
    } catch (err: any) {
      const errorMsg = t('webcam.cameraAccessDenied')
      setError(errorMsg)
      console.error('Camera access error:', err)
      onError(t('webcam.cameraAccessDenied'))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const captureImage = async () => {
    if (!videoRef.current || !cameraActive) {
      setError(t('webcam.cameraNotReady'))
      return
    }

    // Wait for video to be ready
    if (videoRef.current.readyState < 2) {
      setError(t('webcam.videoNotReady'))
      return
    }

    setCapturing(true)
    try {
      const video = videoRef.current
      
      // Check if video has valid dimensions
      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('Video dimensions are invalid. Please wait for camera to initialize.')
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Validate canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas dimensions are invalid')
      }
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.9)
      
      // Validate base64 string
      if (!base64Image || base64Image.length < 100) {
        throw new Error('Failed to encode image. Image data is too small.')
      }
      
      console.log('Image captured successfully, length:', base64Image.length)
      
      // Stop camera after capture
      stopCamera()
      
      // Process the image
      await processImage(base64Image)
    } catch (err: any) {
      setError(err.message || 'Failed to capture image')
      onError(err.message || 'Failed to capture image')
      setCapturing(false)
    }
  }

  const processImage = async (base64Image: string) => {
    setProcessing(true)
    setCapturing(false)
    
    try {
      const endpoint = mode === 'register' ? '/api/face/register' : '/api/face/verify'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voter_id: voterId,
          image: base64Image,
          full_name: fullName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Request failed')
      }

      onComplete(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process face'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleConsent = () => {
    setConsentGiven(true)
    startCamera()
  }

  if (!consentGiven) {
    return (
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">📷</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {mode === 'register' ? t('webcam.registerYourFace') : t('webcam.verifyYourFace')}
            </h3>
            <p className="text-blue-800 mb-4">
              {mode === 'register' 
                ? t('webcam.registerDescription')
                : t('webcam.verifyDescription')}
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>{t('webcam.whatWellDo')}</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>{t('webcam.accessCamera')}</li>
                <li>{t('webcam.capturePhotoDescription')}</li>
                <li>{t('webcam.processImage')} {mode === 'register' ? t('webcam.registration') : t('webcam.verification')}</li>
                <li>{t('webcam.closeAfterCapture')}</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConsent}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {t('webcam.allowCameraAccess')}
              </button>
              <button
                onClick={() => onError(t('webcam.cameraAccessCancelled'))}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {mode === 'register' ? `📷 ${t('webcam.registerYourFace')}` : `🔍 ${t('webcam.verifyYourFace')}`}
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!cameraActive && !processing && !streamRef.current && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">{t('webcam.cameraNotActive')}</p>
          <button
            onClick={startCamera}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {t('webcam.startCamera')}
          </button>
        </div>
      )}

      {/* Always render video element when consent is given, so ref is available */}
      {consentGiven && (
        <div className="space-y-4">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                console.log('Video metadata loaded')
                setCameraActive(true)
              }}
              onPlaying={() => {
                console.log('Video is playing')
                setCameraActive(true)
              }}
              onCanPlay={() => {
                console.log('Video can play')
                setCameraActive(true)
              }}
              className="w-full h-auto max-h-96 object-contain"
            />
            {capturing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-xl font-semibold">Capturing...</div>
              </div>
            )}
            {!streamRef.current && !cameraActive && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="mb-2">{t('webcam.cameraFeed')}</p>
                  <p className="text-sm text-gray-400">{t('webcam.clickStartCamera')}</p>
                </div>
              </div>
            )}
          </div>

          {(cameraActive || streamRef.current) ? (
            <div className="flex gap-3">
              <button
                onClick={captureImage}
                disabled={capturing || processing}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {capturing ? t('webcam.capturing') : processing ? t('webcam.processing') : t('webcam.capturePhoto')}
              </button>
              <button
                onClick={stopCamera}
                disabled={capturing || processing}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <button
                onClick={startCamera}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {t('webcam.startCamera')}
              </button>
            </div>
          )}
        </div>
      )}

      {processing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">
            {mode === 'register' ? t('webcam.registeringFace') : t('webcam.verifyingFace')}
          </p>
        </div>
      )}
    </div>
  )
}

