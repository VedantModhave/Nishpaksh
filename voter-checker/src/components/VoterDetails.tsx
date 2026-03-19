'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WebcamCapture from './WebcamCapture'
import { useLanguage } from '@/contexts/LanguageContext'

interface VoterDetailsProps {
  data: any
}

export default function VoterDetails({ data }: VoterDetailsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [faceResult, setFaceResult] = useState<any>(null)
  const [faceError, setFaceError] = useState<string | null>(null)
  const [showWebcam, setShowWebcam] = useState(false)
  const [webcamMode, setWebcamMode] = useState<'register' | 'verify'>('register')

  if (!data) return null

  const voterId = data.epicNumber
  const fullName = data.fullName || `${data.applicantFirstName} ${data.applicantLastName}`

  const handleFaceComplete = (result: any) => {
    setFaceResult(result)
    setFaceError(null)
    setShowWebcam(false)

    // Redirect to dashboard on successful verification
    if (result && result.verified && webcamMode === 'verify') {
      setTimeout(() => {
        let url = '/dashboard'
        // ECI response typically uses `partLatLong` (camelCase), but keep fallbacks for older shapes.
        const coords =
          (data as any)?.partLatLong ??
          (data as any)?.part_lat_long ??
          (data as any)?.latLong ??
          (data as any)?.partLatlong

        if (coords) url += `?latlong=${encodeURIComponent(String(coords))}`
        router.push(url)
      }, 1500)
    }
  }

  const handleFaceError = (error: string) => {
    setFaceError(error)
    setFaceResult(null)
    setShowWebcam(false)
  }

  const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value || 'N/A'}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
        <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('voterDetails.title')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('voterDetails.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Details */}
        <InfoCard
          icon="👤"
          label={t('voterDetails.fullName')}
          value={data.fullName || `${data.applicantFirstName} ${data.applicantLastName}`}
        />
        <InfoCard
          icon="🆔"
          label={t('voterDetails.epicNumber')}
          value={data.epicNumber}
        />
        <InfoCard
          icon="👨‍👦"
          label={t('voterDetails.relativesName')}
          value={data.relativeFullName || data.relationName}
        />
        <InfoCard
          icon="🔗"
          label={t('voterDetails.relationType')}
          value={data.relationType === 'FTHR' ? t('voterDetails.father') : data.relationType === 'HSBN' ? t('voterDetails.husband') : data.relationType}
        />
        <InfoCard
          icon="🎂"
          label={t('voterDetails.age')}
          value={data.age?.toString()}
        />
        <InfoCard
          icon="⚧"
          label={t('voterDetails.gender')}
          value={data.gender === 'M' ? t('voterDetails.male') : data.gender === 'F' ? t('voterDetails.female') : data.gender}
        />

        {/* Location Details */}
        <InfoCard
          icon="📍"
          label={t('voterDetails.state')}
          value={data.stateName}
        />
        <InfoCard
          icon="🏙️"
          label={t('voterDetails.district')}
          value={data.districtValue}
        />
        <InfoCard
          icon="🏛️"
          label={t('voterDetails.assemblyConstituency')}
          value={`${data.asmblyName} (AC ${data.acNumber})`}
        />
        <InfoCard
          icon="🏢"
          label={t('voterDetails.parliamentConstituency')}
          value={`${data.prlmntName} (${data.prlmntNo})`}
        />

        {/* Electoral Details */}
        <InfoCard
          icon="📄"
          label={t('voterDetails.partNumber')}
          value={data.partNumber}
        />
        <InfoCard
          icon="#️⃣"
          label={t('voterDetails.serialNumber')}
          value={data.partSerialNumber?.toString()}
        />
        <InfoCard
          icon="🔢"
          label={t('voterDetails.sectionNumber')}
          value={data.sectionNo?.toString()}
        />

        {/* Polling Station Details */}
        <div className="md:col-span-2">
          <InfoCard
            icon="🗳️"
            label={t('voterDetails.pollingStation')}
            value={data.psbuildingName}
          />
        </div>
        <div className="md:col-span-2">
          <InfoCard
            icon="📍"
            label={t('voterDetails.pollingStationAddress')}
            value={`${data.buildingAddress} - ${data.psRoomDetails}`}
          />
        </div>
        <div className="md:col-span-2">
          <InfoCard
            icon="📮"
            label={t('voterDetails.partNameAddress')}
            value={data.partName}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>{t('voterDetails.note')}</strong> {t('voterDetails.noteText')}
        </p>
      </div>

      {/* Face Registration/Verification Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('voterDetails.faceRecognition')}</h3>

        {!showWebcam && !faceResult && !faceError && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setWebcamMode('register')
                setShowWebcam(true)
                setFaceError(null)
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              📷 {t('voterDetails.registerFace')}
            </button>
            <button
              onClick={() => {
                setWebcamMode('verify')
                setShowWebcam(true)
                setFaceError(null)
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              🔍 {t('voterDetails.verifyFace')}
            </button>
          </div>
        )}

        {showWebcam && (
          <WebcamCapture
            voterId={voterId}
            fullName={fullName}
            mode={webcamMode}
            onComplete={handleFaceComplete}
            onError={handleFaceError}
          />
        )}

        {/* Face Registration Result */}
        {faceResult && webcamMode === 'register' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-green-900 mb-2">
                  {t('voterDetails.faceRegistrationSuccess')}
                </h4>
                <p className="text-green-800 mb-2">{faceResult.message}</p>
                <p className="text-sm text-green-700">
                  {t('voterDetails.faceRegistered')} <strong>{voterId}</strong>
                </p>
                <button
                  onClick={() => {
                    setFaceResult(null)
                    setFaceError(null)
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {t('voterDetails.registerAnother')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Face Verification Result */}
        {faceResult && webcamMode === 'verify' && (
          <div className={`mt-6 rounded-lg p-6 ${faceResult.verified
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
            }`}>
            <div className="flex items-start gap-4">
              <div className="text-3xl">{faceResult.verified ? '✅' : '⚠️'}</div>
              <div className="flex-1">
                <h4 className={`text-lg font-semibold mb-2 ${faceResult.verified ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                  {faceResult.verified ? t('voterDetails.faceVerificationSuccess') : t('voterDetails.faceVerificationFailed')}
                </h4>
                <p className={faceResult.verified ? 'text-green-800' : 'text-yellow-800'}>
                  {faceResult.message}
                </p>
                {faceResult.confidence !== undefined && faceResult.confidence > 0 && (
                  <p className={`text-sm mt-2 ${faceResult.verified ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                    {t('voterDetails.confidence')} {(faceResult.confidence * 100).toFixed(1)}%
                  </p>
                )}
                {faceResult.message && (faceResult.message.toLowerCase().includes('not found') || faceResult.message.toLowerCase().includes('please register')) ? (
                  <button
                    onClick={() => {
                      setFaceResult(null)
                      setFaceError(null)
                      setWebcamMode('register')
                      setShowWebcam(true)
                    }}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    📷 {t('voterDetails.registerFace')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setFaceResult(null)
                      setFaceError(null)
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t('voterDetails.tryAgain')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Face Error */}
        {faceError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">❌</div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-red-900 mb-2">
                  {faceError.toLowerCase().includes('not found') || faceError.toLowerCase().includes('please register')
                    ? t('voterDetails.faceNotRegistered')
                    : t('common.error')}
                </h4>
                <p className="text-red-800 mb-2">{faceError}</p>
                {faceError.toLowerCase().includes('not found') || faceError.toLowerCase().includes('please register') ? (
                  <button
                    onClick={() => {
                      setFaceError(null)
                      setWebcamMode('register')
                      setShowWebcam(true)
                    }}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    📷 {t('voterDetails.registerFace')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setFaceError(null)
                      setShowWebcam(true)
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t('voterDetails.tryAgain')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raw Data (for debugging) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
          {t('voterDetails.viewRawData')}
        </summary>
        <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  )
}

