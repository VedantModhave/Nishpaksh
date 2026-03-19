'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ConnectWalletProps {
    onConnect?: (account: string) => void
}

export default function ConnectWallet({ onConnect }: ConnectWalletProps) {
    const { t } = useLanguage()
    const [account, setAccount] = useState<string | null>(null)

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
                const connectedAccount = accounts[0]
                setAccount(connectedAccount)
                if (onConnect) {
                    onConnect(connectedAccount)
                }
            } catch (error) {
                console.error('Error connecting to MetaMask', error)
            }
        } else {
            alert(t('wallet.metaMaskNotInstalled'))
        }
    }

    return (
        <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-900/40"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : t('wallet.connectWallet')}
        </button>
    )
}
