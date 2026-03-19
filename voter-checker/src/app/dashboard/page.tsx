'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { castVote, checkEpicVotedStatus } from '@/services/votingService'
import { useOfflineVoting } from '@/hooks/useOfflineVoting'
import { fetchWithCache } from '@/utils/fetchWithCache'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateCandidateName } from '@/utils/candidateTranslations'

// Helper function to update aggregated voter demographics
function updateVoterDemographics(gender: string | null, age: number | null) {
    if (typeof window === 'undefined') return
    
    try {
        // Get existing demographics
        const existingStr = localStorage.getItem('voterDemographics')
        let demographics = existingStr ? JSON.parse(existingStr) : { male: 0, female: 0, other: 0, ages: [] }
        
        // Update gender count
        if (gender) {
            const genderUpper = String(gender).toUpperCase()
            if (genderUpper === 'M' || genderUpper === 'MALE') {
                demographics.male = (demographics.male || 0) + 1
            } else if (genderUpper === 'F' || genderUpper === 'FEMALE') {
                demographics.female = (demographics.female || 0) + 1
            } else {
                demographics.other = (demographics.other || 0) + 1
            }
        }
        
        // Update age list
        if (age) {
            const ageNum = typeof age === 'string' ? parseInt(age) : age
            if (!isNaN(ageNum) && ageNum > 0) {
                if (!demographics.ages) demographics.ages = []
                demographics.ages.push(ageNum)
            }
        }
        
        localStorage.setItem('voterDemographics', JSON.stringify(demographics))
    } catch (error) {
        console.error('Error updating demographics:', error)
    }
}

interface Candidate {
    id: string
    candidate_name: string
    party_name: string
    symbol: string
    ward_no: number
    is_women_reserved?: boolean
}

export default function Dashboard() {
    const { t, languageCode: language } = useLanguage()
    const router = useRouter()
    const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
    const [account, setAccount] = useState<string | null>(null)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [wardName, setWardName] = useState("Detecting ward...")
    const [wardNoState, setWardNoState] = useState<number | null>(null)
    const [epicNumber, setEpicNumber] = useState<string | null>(null)
    const [hasVoted, setHasVoted] = useState<boolean>(false)
    const [checkingVoteStatus, setCheckingVoteStatus] = useState(false)
    
    // Offline voting hook
    const { isOnline, pendingCount, isSyncing, syncVotes, hasPendingVotes } = useOfflineVoting()

    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
    const [voteStep, setVoteStep] = useState<'idle' | 'confirm' | 'mining' | 'success' | 'error'>('idle')
    const [txHash, setTxHash] = useState<string | null>(null)
    const [voteError, setVoteError] = useState<string | null>(null)

    useEffect(() => {
        // Get EPIC number from localStorage (set during voter verification)
        if (typeof window !== 'undefined') {
            const storedEpic = localStorage.getItem('voterEpicNumber')
            if (storedEpic) {
                setEpicNumber(storedEpic)
            } else {
                // Try to get from URL params
                try {
                    const params = new URLSearchParams(window.location.search)
                    const epicParam = params.get('epic')
                    if (epicParam) {
                        setEpicNumber(epicParam)
                        localStorage.setItem('voterEpicNumber', epicParam)
                    }
                } catch (e) {
                    console.error('Error reading EPIC from URL:', e)
                }
            }
        }

        const getAccount = async () => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
                    if (accounts && accounts.length > 0) {
                        setAccount(accounts[0])
                    }
                    
                    // Ensure we're on the correct network
                    const expectedChainId = BigInt(process.env.NEXT_PUBLIC_VOTING_CHAIN_ID ?? '31337')
                    const hexChainId = '0x' + expectedChainId.toString(16)
                    
                    try {
                        const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
                        if (currentChainId !== hexChainId) {
                            // Try to switch network
                            try {
                                await (window as any).ethereum.request({
                                    method: 'wallet_switchEthereumChain',
                                    params: [{ chainId: hexChainId }],
                                })
                            } catch (switchErr: any) {
                                // If network doesn't exist, add it
                                if (switchErr.code === 4902) {
                                    await (window as any).ethereum.request({
                                        method: 'wallet_addEthereumChain',
                                        params: [
                                            {
                                                chainId: hexChainId,
                                                chainName: 'Hardhat Local',
                                                nativeCurrency: {
                                                    name: 'ETH',
                                                    symbol: 'ETH',
                                                    decimals: 18,
                                                },
                                                rpcUrls: ['http://127.0.0.1:8545'],
                                                blockExplorerUrls: null,
                                            },
                                        ],
                                    })
                                }
                            }
                        }
                    } catch (networkError) {
                        console.warn('Network configuration warning:', networkError)
                    }
                } catch (error) {
                    console.error('Error fetching account', error)
                }
            }
        }

        const detectWardAndFetch = async () => {
            setLoading(true)
            let wardNo = 100 // Default fallback

            const extractTwoNumbers = (value: string): [number, number] | null => {
                // Accept any string that contains at least two numbers.
                // Examples:
                // - "19.07,72.87"
                // - "72.87 - 19.07"
                // - "lat: 19.07 lng: 72.87"
                const nums = (value.match(/-?\d+(?:\.\d+)?/g) || [])
                    .map(n => Number(n))
                    .filter(n => Number.isFinite(n))
                if (nums.length < 2) return null
                return [nums[0], nums[1]]
            }

            const getOuterRings = (geometry: any): number[][][] => {
                // Returns a list of rings (each ring is an array of [lng,lat] points)
                if (!geometry) return []
                if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
                    return [geometry.coordinates[0]]
                }
                if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
                    return geometry.coordinates.map((poly: any) => poly?.[0]).filter(Boolean)
                }
                return []
            }

            // 1. Get Lat/Long from URL
            const searchParams = new URLSearchParams(window.location.search)
            const latlong = searchParams.get('latlong')

            if (latlong) {
                try {
                    const two = extractTwoNumbers(latlong)
                    if (!two) throw new Error(`Invalid latlong param: "${latlong}"`)
                    const [a, b] = two

                    // 2. Fetch GeoJSON (with cache for offline support)
                    try {
                        const geoData = await fetchWithCache('/api/ward-data', {
                            cache: 'no-store', // Don't use HTTP cache, but use our IndexedDB cache
                        })

                        const findWardForPoint = (lng: number, lat: number): number | null => {
                            let detectedWard: number | null = null
                            for (const feature of geoData.features) {
                                const rings = getOuterRings(feature?.geometry)
                                for (const ring of rings) {
                                    // GeoJSON points are [lng,lat]
                                    if (Array.isArray(ring) && ring.length > 2 && isPointInPolygon([lng, lat], ring)) {
                                        const noteRaw = feature?.properties?.note
                                        const note = parseInt(String(noteRaw), 10)
                                        if (Number.isFinite(note)) {
                                            detectedWard = note
                                        } else {
                                            console.warn("Ward detected but note is not a number:", noteRaw)
                                        }
                                        break
                                    }
                                }
                                if (detectedWard !== null) break
                            }
                            return detectedWard
                        }

                        // 3. Find Ward (Point in Polygon)
                        // IMPORTANT: We do NOT assume lat/lng order from the string because for India,
                        // longitudes (~72–77) are NOT > 90, so simple heuristics fail. Instead, try both.
                        const attempts = [
                            { lng: a, lat: b, label: 'as [lng,lat]' },
                            { lng: b, lat: a, label: 'swapped [lng,lat]' },
                        ]

                        let detectedWard: number | null = null
                        let chosenAttempt: string | null = null
                        for (const attempt of attempts) {
                            const w = findWardForPoint(attempt.lng, attempt.lat)
                            if (w !== null) {
                                detectedWard = w
                                chosenAttempt = attempt.label
                                break
                            }
                        }

                        if (detectedWard !== null) {
                            wardNo = detectedWard
                            console.log("Detected Ward:", detectedWard, "using", chosenAttempt, "from latlong:", latlong)
                        } else {
                            console.warn("No ward match found for point (tried both orders):", {
                                latlong,
                                attempt1: { lng: attempts[0].lng, lat: attempts[0].lat },
                                attempt2: { lng: attempts[1].lng, lat: attempts[1].lat },
                            })
                        }
                    } catch (geoError: any) {
                        console.error("Failed to load ward geojson:", geoError.message || geoError)
                        // If offline and no cache, use default ward
                    }
                } catch (e) {
                    console.error("Error detecting ward:", e)
                }
            }

            setWardName(`Ward ${wardNo}`)
            setWardNoState(wardNo)

            // 4. Fetch Candidates for Ward (with cache for offline support)
            try {
                const url = `https://kvixkemyrydjihzqwaat.supabase.co/rest/v1/bmc_candidates?select=*%2Ccase_info%3Abmc_candidate_case_info%21bmc_candidate_case_info_candidate_id_fkey%28education%2Cactive_cases%2Cclosed_cases%29&ward_no=eq.${wardNo}`
                const headers = {
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aXhrZW15cnlkamloenF3YWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU2MTEsImV4cCI6MjA4MzExMTYxMX0.3CaKW2n-IH9uOJOB_RJU8cSAF-Toq1wCc43u5QLTJCQ",
                    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aXhrZW15cnlkamloenF3YWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU2MTEsImV4cCI6MjA4MzExMTYxMX0.3CaKW2n-IH9uOJOB_RJU8cSAF-Toq1wCc43u5QLTJCQ"
                }

                // Use fetchWithCache - will use cache if offline, fetch fresh if online
                const data = await fetchWithCache<Candidate[]>(url, {
                    headers,
                    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours - candidates don't change often
                })
                setCandidates(data)
            } catch (error: any) {
                console.error("Error fetching candidates:", error.message || error)
                // If offline and no cache, candidates will be empty array
                // User can still see the dashboard, just won't see candidates
            } finally {
                setLoading(false)
            }
        }

        getAccount()
        detectWardAndFetch()
    }, [])

    // Check if EPIC has already voted
    useEffect(() => {
        const checkVoteStatus = async () => {
            if (!epicNumber) return
            
            try {
                setCheckingVoteStatus(true)
                const voted = await checkEpicVotedStatus(epicNumber)
                setHasVoted(voted)
            } catch (error) {
                console.error('Error checking vote status:', error)
                // Don't block voting if check fails
            } finally {
                setCheckingVoteStatus(false)
            }
        }

        if (epicNumber) {
            checkVoteStatus()
        }
    }, [epicNumber])

    const closeVoteModal = () => {
        if (voteStep === 'mining') return
        setSelectedCandidate(null)
        setVoteStep('idle')
        setVoteError(null)
        setTxHash(null)
        setRedirectCountdown(null)
    }

    // Handle countdown and redirect after successful vote
    useEffect(() => {
        if (voteStep === 'success' && redirectCountdown !== null && redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(redirectCountdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else if (voteStep === 'success' && redirectCountdown === 0) {
            // Redirect to home page after countdown
            router.push('/')
        }
    }, [voteStep, redirectCountdown, router])

    const openVoteModal = (candidate: Candidate) => {
        setSelectedCandidate(candidate)
        setVoteStep('confirm')
        setVoteError(null)
        setTxHash(null)
    }

    const confirmAndSignVote = async () => {
        if (!selectedCandidate) return
        if (!wardNoState) {
            setVoteStep('error')
            setVoteError(t('dashboard.wardNotDetected'))
            return
        }
        if (!epicNumber) {
            setVoteStep('error')
            setVoteError(t('dashboard.epicNotFoundForVote'))
            return
        }

        setVoteStep('mining')
        setVoteError(null)
        setTxHash(null)

        try {
            // Use 0 as candidate ID for NOTA
            const candidateId = selectedCandidate.id === 'NOTA' ? 0 : selectedCandidate.id
            
            const result = await castVote({
                epicNumber: epicNumber,
                candidateId: candidateId,
                wardId: wardNoState,
                candidateName: selectedCandidate.candidate_name,
            })
            
            // Check if vote was queued (offline mode)
            if ((result as any).queued) {
                // Vote was queued for offline sync
                setVoteStep('success')
                setTxHash(null)
                // Start countdown for redirect
                setRedirectCountdown(5)
                // Store demographics even for queued votes
                if (typeof window !== 'undefined') {
                    try {
                        const voterDataStr = localStorage.getItem('voterData')
                        if (voterDataStr) {
                            const voterData = JSON.parse(voterDataStr)
                            updateVoterDemographics(voterData.gender, voterData.age)
                        }
                    } catch (error) {
                        console.error('Error storing voter demographics:', error)
                    }
                }
                return // Exit early for queued votes
            }
            
            // Vote was cast online
            const { txHash } = result
            
            // Store voter demographics when vote is cast
            if (typeof window !== 'undefined') {
                try {
                    const voterDataStr = localStorage.getItem('voterData')
                    if (voterDataStr) {
                        const voterData = JSON.parse(voterDataStr)
                        updateVoterDemographics(voterData.gender, voterData.age)
                    }
                } catch (error) {
                    console.error('Error storing voter demographics:', error)
                }
            }
            
            setTxHash(txHash)
            setVoteStep('success')
            // Start countdown for redirect
            setRedirectCountdown(5)
        } catch (e: any) {
            // Extract the most helpful error message
            let errorMsg = 'Vote failed'
            
            if (e?.shortMessage) {
                errorMsg = e.shortMessage
            } else if (e?.reason) {
                errorMsg = e.reason
            } else if (e?.message) {
                errorMsg = e.message
            } else if (typeof e === 'string') {
                errorMsg = e
            }
            
            // Clean up common error messages
            if (errorMsg.includes('coalesce')) {
                errorMsg = 'Transaction failed. Please ensure:\n1. MetaMask is connected\n2. You have enough ETH for gas\n3. The contract is deployed correctly'
            }
            
            console.error('Vote error:', e)
            setVoteError(errorMsg)
            setVoteStep('error')
        }
    }

    // Ray Casting Algorithm
    const isPointInPolygon = (point: number[], vs: number[][]) => {
        const x = point[0], y = point[1]
        let inside = false
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1]
            const xj = vs[j][0], yj = vs[j][1]
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if (intersect) inside = !inside
        }
        return inside
    }

    // Get symbol image path - maps party names and symbols to image file paths
    const getSymbolImagePath = (partyName: string, symbol: string, isWomenReserved?: boolean): string | null => {
        if (!partyName && !symbol) return null
        
        const partyLower = (partyName || '').toLowerCase().trim()
        const symbolLower = (symbol || '').toLowerCase().trim()
        
        // Handle Independent candidates first (gender-aware)
        if (partyLower.includes('independent')) {
            return `/party-symbols/${isWomenReserved ? 'generic-female.webp' : 'generic.webp'}`
        }
        
        // Map party names to logo files (primary mapping - most reliable)
        const partyMap: { [key: string]: string } = {
            'bharatiya janata party': 'bjp-logo.webp',
            'bjp': 'bjp-logo.webp',
            'indian national congress': 'congress-logo.webp',
            'congress': 'congress-logo.webp',
            'shiv sena (uddhav balasaheb thackeray)': 'shivsena-ubt-logo.webp',
            'shiv sena uddhav balasaheb thackeray': 'shivsena-ubt-logo.webp',
            'shiv sena': 'shivsena-logo.webp',
            'nationalist congress party': 'ncp-logo.webp',
            'ncp': 'ncp-logo.webp',
            'maharashtra navnirman sena': 'mns-logo.webp',
            'mns': 'mns-logo.webp',
            'bahujan samaj party': 'bahujan-party.webp',
            'bahujan': 'bahujan-party.webp',
            'samajwadi party': 'samaajvadi-logo.webp',
            'samajwadi': 'samaajvadi-logo.webp',
            'janata dal (secular)': 'jds-logo-badge.png',
            'janata dal secular': 'jds-logo-badge.png',
            'janata dal': 'jds-logo-badge.png',
            'jds': 'jds-logo-badge.png',
        }
        
        // Map symbols to logo files (fallback mapping)
        const symbolMap: { [key: string]: string } = {
            'lotus': 'bjp-logo.webp',
            'hand': 'congress-logo.webp',
            'flaming torch': 'shivsena-ubt-logo.webp',
            'torch': 'shivsena-ubt-logo.webp',
            'book': isWomenReserved ? 'generic-female.webp' : 'generic.webp',
        }
        
        // First, try party name mapping (most reliable)
        for (const [key, filename] of Object.entries(partyMap)) {
            if (partyLower.includes(key) || partyLower === key) {
                return `/party-symbols/${filename}`
            }
        }
        
        // Then, try symbol mapping
        for (const [key, filename] of Object.entries(symbolMap)) {
            if (symbolLower.includes(key) || symbolLower === key) {
                return `/party-symbols/${filename}`
            }
        }
        
        // Fallback: try partial matches for party names
        if (partyLower.includes('shiv sena') && partyLower.includes('uddhav')) {
            return '/party-symbols/shivsena-ubt-logo.webp'
        }
        if (partyLower.includes('shiv sena')) {
            return '/party-symbols/shivsena-logo.webp'
        }
        
        return null
    }

    // Fallback emoji icons if image doesn't exist
    const getSymbolIcon = (symbol: string) => {
        const lower = symbol?.toLowerCase() || ''
        if (lower.includes('lotus')) return '🪷'
        if (lower.includes('hand')) return '✋'
        if (lower.includes('book')) return '📖'
        if (lower.includes('torch')) return '🔥'
        if (lower.includes('clock')) return '⏰'
        if (lower.includes('cycle')) return '🚲'
        if (lower.includes('lantern')) return '🏮'
        return '👤'
    }

    const getCardColor = (index: number) => {
        const colors = ['bg-blue-900', 'bg-indigo-900', 'bg-teal-900', 'bg-purple-900', 'bg-cyan-900']
        return colors[index % colors.length]
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex font-sans">
            {/* Vote Confirmation / Status Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/70" onClick={closeVoteModal} />
                    <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {voteStep === 'confirm' && t('dashboard.confirmYourVote')}
                                    {voteStep === 'mining' && t('dashboard.confirmingOnBlockchain')}
                                    {voteStep === 'success' && t('dashboard.voteSuccessful')}
                                    {voteStep === 'error' && t('dashboard.voteFailed')}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {t('dashboard.ward')} <span className="text-gray-200 font-semibold">{wardNoState ?? '...'}</span>
                                </p>
                            </div>
                            <button
                                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                onClick={closeVoteModal}
                                disabled={voteStep === 'mining'}
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-semibold">
                                        {selectedCandidate.id === 'NOTA' 
                                            ? t('dashboard.noneOfAbove')
                                            : translateCandidateName(selectedCandidate.candidate_name, selectedCandidate.id, language)
                                        }
                                    </div>
                                    <div className="text-sm text-blue-400">
                                        {selectedCandidate.id === 'NOTA' ? 'NOTA' : selectedCandidate.party_name}
                                    </div>
                                    {selectedCandidate.id !== 'NOTA' && (
                                        <div className="text-xs text-gray-500 mt-1">Symbol: {selectedCandidate.symbol}</div>
                                    )}
                                </div>
                                <div className="text-3xl">
                                    {getSymbolImagePath(
                                        selectedCandidate.party_name, 
                                        selectedCandidate.symbol,
                                        selectedCandidate.is_women_reserved
                                    ) ? (
                                        <Image
                                            src={getSymbolImagePath(
                                                selectedCandidate.party_name, 
                                                selectedCandidate.symbol,
                                                selectedCandidate.is_women_reserved
                                            )!}
                                            alt={selectedCandidate.symbol}
                                            width={48}
                                            height={48}
                                            className="object-contain"
                                        />
                                    ) : (
                                        getSymbolIcon(selectedCandidate.symbol)
                                    )}
                                </div>
                            </div>
                        </div>

                        {voteStep === 'confirm' && (
                            <div className="text-sm text-gray-400 mb-4">
                                {isOnline ? (
                                    <>{t('dashboard.clickingConfirm')} <span className="text-white font-semibold">{t('dashboard.confirmSign')}</span> {t('dashboard.willOpenMetaMask')}</>
                                ) : (
                                    <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-3 text-yellow-200">
                                        <div className="font-semibold mb-1">{t('dashboard.youAreOffline')}</div>
                                        <div className="text-xs">{t('dashboard.voteSavedLocally')}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {voteStep === 'mining' && (
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    {t('dashboard.waitingForConfirmation')}
                                </div>
                                <div className="text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-2">
                                    <strong>{t('dashboard.important')}</strong> {t('dashboard.checkMetaMask')}
                                </div>
                            </div>
                        )}

                        {voteStep === 'success' && (
                            <div className="space-y-4 mb-4">
                                {/* Success Message */}
                                <div className="bg-green-950/30 border border-green-900/40 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <div className="text-green-400 font-semibold text-lg">{t('dashboard.voteSuccessful')}</div>
                                            <div className="text-green-200 text-sm mt-1">{t('dashboard.voteSuccessfulMessage')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Hash (if available) */}
                                {txHash && (
                                    <div className="text-sm text-gray-300">
                                        <div className="text-gray-400 text-xs mb-1">{t('dashboard.transactionConfirmed')}</div>
                                        <div className="font-mono break-all bg-gray-950/40 border border-gray-800 rounded-lg p-3 text-xs">
                                            {txHash}
                                        </div>
                                    </div>
                                )}

                                {/* Offline Queue Message (if no txHash) */}
                                {!txHash && (
                                    <div className="text-sm text-gray-300">
                                        <div className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {t('dashboard.voteQueued')}
                                        </div>
                                        <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-3 text-yellow-200">
                                            {t('dashboard.voteSavedForSync')}
                                        </div>
                                    </div>
                                )}

                                {/* Countdown Message */}
                                {redirectCountdown !== null && redirectCountdown > 0 && (
                                    <div className="text-center text-sm text-blue-400 font-medium">
                                        {t('dashboard.redirectingToHome', redirectCountdown.toString())}
                                    </div>
                                )}
                            </div>
                        )}

                        {voteStep === 'error' && voteError && (
                            <div className="text-sm text-red-300 mb-4 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
                                {voteError}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            {voteStep === 'confirm' && (
                                <>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                                        onClick={closeVoteModal}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                                        onClick={confirmAndSignVote}
                                    >
                                        {t('dashboard.confirmSign')}
                                    </button>
                                </>
                            )}

                            {voteStep === 'mining' && (
                                <button
                                    className="px-4 py-2 rounded-lg bg-blue-600/60 text-white font-semibold cursor-not-allowed"
                                    disabled
                                >
                                    {t('dashboard.confirming')}
                                </button>
                            )}

                            {voteStep === 'success' && (
                                <button
                                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                                    onClick={() => router.push('/')}
                                >
                                    {t('common.back')}
                                </button>
                            )}

                            {voteStep === 'error' && (
                                <button
                                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                                    onClick={() => setVoteStep('confirm')}
                                >
                                    {t('common.back')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
                <div className="p-6 flex items-center">
                    <Image 
                        src="/nishpaksh.png" 
                        alt="Nishpaksh Logo" 
                        width={200} 
                        height={60}
                        className="object-contain h-12 w-auto"
                        priority
                    />
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <div className="mb-8">
                        <div className="bg-gray-800 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 text-blue-400 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="font-semibold">{t('dashboard.secureVoting')}</span>
                            </div>
                            <span className="text-xs text-gray-400 ml-8">{t('dashboard.statusConnected')}</span>
                        </div>

                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            {t('dashboard.electionBallot')}
                        </button>
                    </div>
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-green-500 tracking-wider">{t('dashboard.blockchainLive')}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {t('dashboard.voteEncrypted')}
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.networkInfo')}</h3>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{t('dashboard.blockHeight')}</span>
                        <span className="text-gray-300 font-mono">#18,293,011</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{t('dashboard.gasPrice')}</span>
                        <span className="text-gray-300 font-mono">12 Gwei</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-8 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-6">
                        {/* Mobile Menu Button - Visual only */}
                        <button className="md:hidden text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                            <a href="#" className="text-white hover:text-white transition-colors">{t('nav.dashboard')}</a>
                        </nav>
                        <div className="h-4 w-px bg-gray-700 hidden md:block"></div>
                        <LanguageSwitcher />
                        
                        {/* Offline Status & Pending Votes Indicator */}
                        {!isOnline && (
                            <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1.5 rounded-full border border-yellow-700/50">
                                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                                </svg>
                                <span className="text-xs font-semibold text-yellow-400">{t('dashboard.offline')}</span>
                            </div>
                        )}
                        
                        {hasPendingVotes && isOnline && (
                            <button
                                onClick={async () => {
                                    try {
                                        await syncVotes()
                                    } catch (error: any) {
                                        console.error('Sync failed:', error)
                                    }
                                }}
                                disabled={isSyncing}
                                className="flex items-center gap-2 bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-700/50 hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                            >
                                {isSyncing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-semibold text-blue-400">{t('dashboard.syncing')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span className="text-xs font-semibold text-blue-400">
                                            {pendingCount} {t('dashboard.pending')}
                                        </span>
                                    </>
                                )}
                            </button>
                        )}
                        
                        {hasPendingVotes && !isOnline && (
                            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-semibold text-gray-400">
                                    {pendingCount} {t('dashboard.queued')}
                                </span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <span className="text-xs font-mono text-gray-300">
                                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : t('wallet.notConnected')}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-orange-200 border-2 border-orange-300"></div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{wardName}</h1>
                                <p className="text-gray-400">{t('dashboard.step1of2')}</p>
                                {epicNumber && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{t('dashboard.epic')} {epicNumber}</span>
                                        {checkingVoteStatus ? (
                                            <span className="text-xs text-gray-400">{t('dashboard.checkingVoteStatus')}</span>
                                        ) : hasVoted ? (
                                            <span className="text-xs text-red-400 font-semibold">{t('dashboard.alreadyVoted')}</span>
                                        ) : (
                                            <span className="text-xs text-green-400 font-semibold">{t('dashboard.eligibleToVote')}</span>
                                        )}
                                    </div>
                                )}
                                {!epicNumber && (
                                    <div className="mt-2">
                                        <span className="text-xs text-yellow-400">{t('dashboard.epicNotFound')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {/* Loading State */}
                            {loading && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* Live Candidates */}
                            {!loading && candidates.map((candidate, index) => (
                                <CandidateCard
                                    key={candidate.id}
                                    name={translateCandidateName(candidate.candidate_name, candidate.id, language)}
                                    party={candidate.party_name}
                                    symbol={candidate.symbol}
                                    imageColor={getCardColor(index)}
                                    badgeIcon={getSymbolIcon(candidate.symbol)}
                                    symbolImagePath={getSymbolImagePath(
                                        candidate.party_name, 
                                        candidate.symbol,
                                        candidate.is_women_reserved
                                    )}
                                    onVote={() => openVoteModal(candidate)}
                                />
                            ))}

                            {/* NOTA - Always present */}
                            {!loading && (
                                <div 
                                    className="bg-gray-800 rounded-xl p-8 border border-gray-700 flex flex-col items-center text-center hover:border-gray-500 transition-all cursor-pointer group h-full justify-between"
                                    onClick={() => {
                                        const notaCandidate: Candidate = {
                                            id: 'NOTA',
                                            candidate_name: 'None of the Above',
                                            party_name: 'NOTA',
                                            symbol: 'None',
                                            ward_no: wardNoState || 0,
                                        }
                                        openVoteModal(notaCandidate)
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-full bg-gray-700 mb-4 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                                            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1">{t('dashboard.noneOfAbove')}</h3>
                                        <p className="text-sm text-gray-400">{t('dashboard.rejectAll')}</p>
                                    </div>
                                    <button 
                                        className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            const notaCandidate: Candidate = {
                                                id: 'NOTA',
                                                candidate_name: 'None of the Above',
                                                party_name: 'NOTA',
                                                symbol: 'None',
                                                ward_no: wardNoState || 0,
                                            }
                                            openVoteModal(notaCandidate)
                                        }}
                                    >
                                        {t('dashboard.selectNota')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-800 p-4 md:p-6 bg-gray-900 shadow-2xl shrink-0">
                    <div className="max-w-6xl mx-auto bg-gray-800 rounded-xl p-4 flex items-center justify-center border border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-400 shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">{t('dashboard.encryptedSubmission')}</h4>
                                <p className="text-sm text-gray-400">{t('dashboard.selectionAnonymous')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function CandidateCard({
    name,
    party,
    symbol,
    imageColor,
    badgeIcon,
    symbolImagePath,
    onVote,
    disabled = false,
}: {
    name: string
    party: string
    symbol: string
    imageColor: string
    badgeIcon: string
    symbolImagePath?: string | null
    onVote?: () => void
    disabled?: boolean
}) {
    const { t } = useLanguage()
    const [imageError, setImageError] = useState(false)

    return (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 flex flex-col items-center text-center hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden h-full justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex flex-col items-center w-full">
                <div className={`w-24 h-24 rounded-full ${imageColor} mb-4 flex items-center justify-center relative group-hover:scale-105 transition-transform overflow-hidden`}>
                    {/* Party Symbol - Shows image if available, otherwise emoji */}
                    {symbolImagePath && !imageError ? (
                        <Image
                            src={symbolImagePath}
                            alt={symbol}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <span className="text-4xl text-white opacity-80">{badgeIcon}</span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{name}</h3>
                <p className="text-blue-400 text-sm font-medium mb-1">{party}</p>
                <p className="text-gray-500 text-xs italic mb-6">Symbol: {symbol}</p>
            </div>

            <button
                onClick={onVote}
                disabled={disabled}
                className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                    disabled 
                        ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                }`}
            >
                {disabled ? t('dashboard.cannotVote') : t('dashboard.castVote')}
                {!disabled && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
        </div>
    )
}
