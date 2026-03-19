'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getVotingStats, getTransactionDetails, formatTimestamp, VoteTransaction, getPartyVoteData, getGenderDistribution, getAgeDistribution, getNotaVoteCount, PartyVoteData, GenderDistribution, AgeDistribution } from '@/services/resultsService'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ResultsPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [isAutoRefresh, setIsAutoRefresh] = useState(true)
    const [account, setAccount] = useState<string | null>(null)
    const [lastTx, setLastTx] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalVotes: BigInt(0),
        blockHeight: 0,
        totalCandidates: 0,
        recentTransactions: [] as VoteTransaction[],
    })
    const [partyData, setPartyData] = useState<PartyVoteData[]>([])
    const [genderData, setGenderData] = useState<GenderDistribution>({ male: 0, female: 0, other: 0 })
    const [ageData, setAgeData] = useState<AgeDistribution[]>([])
    const [notaCount, setNotaCount] = useState<number>(0)
    const [networkName, setNetworkName] = useState<string>('Loading...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Get transaction hash from URL
        try {
            const sp = new URLSearchParams(window.location.search)
            const txHash = sp.get('tx')
            if (txHash) {
                setLastTx(txHash)
            }
        } catch { }

        const getAccount = async () => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
                    if (accounts && accounts.length > 0) {
                        setAccount(accounts[0])
                    }
                } catch (error) {
                    console.error('Error fetching account', error)
                }
            }
        }
        getAccount()

        // Fetch voting stats
        fetchStats()

        // Auto-refresh if enabled
        let interval: NodeJS.Timeout | null = null
        if (isAutoRefresh) {
            interval = setInterval(() => {
                fetchStats()
            }, 60000) // Refresh every 1 minute
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isAutoRefresh])
    
    // Also refresh block height more frequently for real-time updates
    useEffect(() => {
        const blockHeightInterval = setInterval(async () => {
            try {
                if (typeof window !== 'undefined' && (window as any).ethereum) {
                    const { BrowserProvider } = await import('ethers')
                    const provider = new BrowserProvider((window as any).ethereum)
                    const blockNumber = await provider.getBlockNumber()
                    setStats(prev => ({ ...prev, blockHeight: blockNumber }))
                }
            } catch (error) {
                console.error('Error updating block height:', error)
            }
        }, 2000) // Update block height every 2 seconds
        
        return () => clearInterval(blockHeightInterval)
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Get network name first
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const { BrowserProvider } = await import('ethers')
                    const provider = new BrowserProvider((window as any).ethereum)
                    const network = await provider.getNetwork()
                    const chainId = Number(network.chainId)
                    if (chainId === 11155111) {
                        setNetworkName('Sepolia Testnet')
                    } else if (chainId === 31337) {
                        setNetworkName('Hardhat Local')
                    } else {
                        setNetworkName(`Chain ${chainId}`)
                    }
                } catch (err) {
                    console.error('Error getting network:', err)
                    setNetworkName('Unknown Network')
                }
            }
            
            const [votingStats, parties, gender, age, nota] = await Promise.all([
                getVotingStats(),
                getPartyVoteData(),
                getGenderDistribution(),
                getAgeDistribution(),
                getNotaVoteCount(),
            ])
            
            // Calculate total votes from party data (to sync with Current Vote Count)
            const totalVotesFromParties = parties.reduce((sum, party) => sum + party.votes, 0)
            const totalCandidatesFromParties = parties.length > 0 ? parties.length : votingStats.totalCandidates
            
            // Ensure block height is updated and sync vote counts
            setStats({
                ...votingStats,
                totalVotes: totalVotesFromParties > 0 ? BigInt(totalVotesFromParties) : votingStats.totalVotes,
                totalCandidates: totalCandidatesFromParties,
                blockHeight: votingStats.blockHeight, // Force update
            })
            setPartyData(parties)
            setGenderData(gender)
            setAgeData(age)
            setNotaCount(nota)
        } catch (err: any) {
            console.error('Error fetching stats:', err)
            setError(err.message || 'Failed to fetch voting statistics')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex font-sans">
            {/* Sidebar - Same as Dashboard */}
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

                        <Link href="/results" className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {t('nav.results')}
                        </Link>
                    </div>
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-green-500 tracking-wider">{t('dashboard.blockchainLive')}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {t('results.realTimeCounting')}
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.networkInfo')}</h3>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{t('dashboard.blockHeight')}</span>
                        <span className="text-gray-300 font-mono">#{stats.blockHeight.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{t('results.network')}</span>
                        <span className="text-gray-300 font-mono">{networkName}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
                {/* Header - Same as Dashboard */}
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-8 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-6">
                        <button className="md:hidden text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                            <Link href="/results" className="text-white hover:text-white transition-colors">{t('nav.results')}</Link>
                        </nav>
                        <div className="h-4 w-px bg-gray-700 hidden md:block"></div>
                        <LanguageSwitcher />
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
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
                        <div className="mb-8">
                            {lastTx && (
                                <div className="mb-4 bg-blue-950/40 border border-blue-900/40 rounded-xl p-4">
                                    <div className="text-xs font-bold tracking-wider text-blue-300 mb-1">{t('results.lastVoteTransaction')}</div>
                                    <div className="font-mono text-sm text-blue-200 break-all">{lastTx}</div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-wider mb-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                {t('results.liveBlockchainFeed')}
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">{t('results.votingResults')}</h1>
                                    <p className="text-gray-400">{t('results.subtitle')}</p>
                                </div>
                                <button
                                    onClick={fetchStats}
                                    disabled={loading}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {loading ? t('results.refreshing') : t('common.refresh')}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-950/30 border border-red-900/40 rounded-xl p-4">
                                <div className="text-red-300 font-semibold mb-1">{t('results.errorLoadingData')}</div>
                                <div className="text-sm text-red-200">{error}</div>
                                <div className="text-xs text-red-400 mt-2">{t('results.makeSureMetaMask')}</div>
                            </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                            {/* Total Votes */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group hover:border-gray-600 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('results.totalVotesCast')}</h3>
                                    <div className="text-blue-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">
                                    {loading ? '...' : stats.totalVotes.toString()}
                                </div>
                                <div className="text-xs text-green-500 font-medium">
                                    {stats.recentTransactions.length > 0 ? `+${stats.recentTransactions.length} ${t('results.recent')}` : t('results.noVotesYet')}
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent opacity-50"></div>
                            </div>

                            {/* NOTA Votes */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group hover:border-gray-600 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('dashboard.noneOfAbove')}</h3>
                                    <div className="text-gray-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">
                                    {loading ? '...' : notaCount}
                                </div>
                                <div className="text-xs text-gray-500 font-medium italic">
                                    {t('dashboard.rejectAll')}
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-transparent opacity-50"></div>
                            </div>

                            {/* Block Height */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group hover:border-gray-600 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('results.blockHeight')}</h3>
                                    <div className="text-teal-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">
                                    {loading ? '...' : `#${stats.blockHeight.toLocaleString()}`}
                                </div>
                                <div className="text-xs text-gray-500 font-medium italic">{networkName}</div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-50"></div>
                            </div>

                            {/* Total Candidates */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group hover:border-gray-600 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('results.candidates')}</h3>
                                    <div className="text-orange-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">
                                    {loading ? '...' : stats.totalCandidates}
                                </div>
                                <div className="text-xs text-gray-500 font-medium italic">{t('results.uniqueCandidatesVoted')}</div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-transparent opacity-50"></div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden group hover:border-gray-600 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('results.recentVotes')}</h3>
                                    <div className="text-purple-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">
                                    {loading ? '...' : stats.recentTransactions.length}
                                </div>
                                <div className="text-xs text-gray-500 font-medium italic">{t('results.last20Transactions')}</div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-transparent opacity-50"></div>
                            </div>
                        </div>

                        {/* Party-wise Seat Projection */}
                        {partyData.length > 0 && (
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{t('results.currentVoteCount')}</h2>
                                        <p className="text-gray-400 text-sm">{t('results.votesCastByParty')}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        {partyData.slice(0, 4).map((party, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${party.color}`}></div>
                                                <span className="text-gray-400">{party.partyName.length > 15 ? party.partyName.substring(0, 15) + '...' : party.partyName}</span>
                                            </div>
                                        ))}
                                        {partyData.length > 4 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                                <span className="text-gray-400">OTH</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {partyData.map((party, idx) => {
                                        const totalVotes = partyData.reduce((sum, p) => sum + p.votes, 0)
                                        const isLeading = idx === 0 && totalVotes > 0
                                        const progressPercentage = totalVotes > 0 ? (party.votes / totalVotes) * 100 : 0
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-semibold">{party.partyName}</span>
                                                        {isLeading && (
                                                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded">{t('results.leading')}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-white font-bold">{party.votes} {t('results.votes')}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-full ${party.color} transition-all duration-500`}
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Gender Distribution Pie Chart */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">{t('results.voteShare')}</h3>
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Male', value: genderData.male || 0, fill: '#3b82f6' },
                                                        { name: 'Female', value: genderData.female || 0, fill: '#ec4899' },
                                                        { name: 'Other', value: genderData.other || 0, fill: '#8b5cf6' },
                                                    ].filter(item => item.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => {
                                                        const total = (genderData.male || 0) + (genderData.female || 0) + (genderData.other || 0)
                                                        if (total === 0) return ''
                                                        const percentage = Math.min(100, ((percent || 0) * 100))
                                                        return `${name} ${percentage.toFixed(1)}%`
                                                    }}
                                                    outerRadius={100}
                                                    innerRadius={60}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#3b82f6" />
                                                    <Cell fill="#ec4899" />
                                                    <Cell fill="#8b5cf6" />
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: any) => {
                                                        const total = (genderData.male || 0) + (genderData.female || 0) + (genderData.other || 0)
                                                        const percentage = total > 0 ? Math.min(100, ((value / total) * 100)) : 0
                                                        return [`${value} (${percentage.toFixed(1)}%)`, 'Votes']
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-white">
                                                    {(() => {
                                                        const genderTotal = (genderData.male || 0) + (genderData.female || 0) + (genderData.other || 0)
                                                        if (genderTotal === 0) return '0'
                                                        // Show 100% since the pie chart represents the distribution of votes WITH gender data
                                                        return '100'
                                                    })()}%
                                                </div>
                                                <div className="text-sm text-gray-400">{t('results.counted')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="text-center">
                                        <div className="text-gray-400 text-sm mb-1">{t('voterDetails.male').toUpperCase()}</div>
                                        <div className="text-white text-xl font-semibold">
                                            {(() => {
                                                const genderTotal = (genderData.male || 0) + (genderData.female || 0) + (genderData.other || 0)
                                                if (genderTotal === 0) return '0%'
                                                const percentage = Math.min(100, ((genderData.male / genderTotal) * 100))
                                                return `${percentage.toFixed(1)}%`
                                            })()}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-400 text-sm mb-1">{t('voterDetails.female').toUpperCase()}</div>
                                        <div className="text-white text-xl font-semibold">
                                            {(() => {
                                                const genderTotal = (genderData.male || 0) + (genderData.female || 0) + (genderData.other || 0)
                                                if (genderTotal === 0) return '0%'
                                                const percentage = Math.min(100, ((genderData.female / genderTotal) * 100))
                                                return `${percentage.toFixed(1)}%`
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Age Distribution Bar Chart */}
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">{t('results.voterAgeDistribution')}</h3>
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={ageData.filter(item => item.count > 0).length > 0 ? ageData : [
                                            { ageRange: '18-25', count: 0 },
                                            { ageRange: '26-35', count: 0 },
                                            { ageRange: '36-45', count: 0 },
                                            { ageRange: '46-55', count: 0 },
                                            { ageRange: '56-65', count: 0 },
                                            { ageRange: '65+', count: 0 },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis 
                                                dataKey="ageRange" 
                                                stroke="#9ca3af"
                                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                            />
                                            <YAxis 
                                                stroke="#9ca3af"
                                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                allowDecimals={false}
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#1f2937', 
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }}
                                                formatter={(value: any) => [value, 'Voters']}
                                            />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">{t('results.recentVoteTransactions')}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 font-medium">{t('results.autoRefresh')}</span>
                                    <button
                                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isAutoRefresh ? 'bg-blue-600' : 'bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAutoRefresh ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {loading && stats.recentTransactions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400">{t('results.loadingTransactions')}</p>
                                </div>
                            ) : stats.recentTransactions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-400 mb-2">{t('results.noVotesCastYet')}</p>
                                    <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
                                        {t('results.goToDashboard')}
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-900 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">{t('results.txHash')}</th>
                                                <th className="px-6 py-4">{t('results.block')}</th>
                                                <th className="px-6 py-4">{t('results.timestamp')}</th>
                                                <th className="px-6 py-4">{t('results.voter')}</th>
                                                <th className="px-6 py-4">{t('results.candidateId')}</th>
                                                <th className="px-6 py-4">{t('results.ward')}</th>
                                                <th className="px-6 py-4">{t('results.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {stats.recentTransactions.map((tx, index) => (
                                                <tr key={index} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-blue-400">
                                                        <span className="flex items-center gap-2">
                                                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-white font-medium">#{tx.blockNumber}</td>
                                                    <td className="px-6 py-4 text-gray-400">{formatTimestamp(tx.timestamp)}</td>
                                                    <td className="px-6 py-4 font-mono text-gray-300 text-xs">
                                                        {tx.voter.slice(0, 6)}...{tx.voter.slice(-4)}
                                                    </td>
                                                    <td className="px-6 py-4 text-white font-medium">{tx.candidateId.toString()}</td>
                                                    <td className="px-6 py-4 text-gray-300">{tx.wardId.toString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 ${tx.status === 'Verified' ? 'text-green-500' : 'text-blue-400'} border border-gray-700/50`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tx.status === 'Verified' ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                                                            {tx.status === 'Verified' ? t('results.verified') : tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
