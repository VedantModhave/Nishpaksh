'use client'

import Link from 'next/link'
import Image from 'next/image'
import ConnectWallet from '@/components/ConnectWallet'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PrivacyPolicy() {
  const { t } = useLanguage()

  const handleWalletConnect = (address: string) => {
    // Wallet connect handler
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/">
                <Image 
                  src="/nishpaksh.png" 
                  alt="Nishpaksh Logo" 
                  width={200} 
                  height={60}
                  className="object-contain h-16 w-auto"
                  priority
                />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ConnectWallet onConnect={handleWalletConnect} />
              <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('common.back')}
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to Nishpaksh, a blockchain-based transparent voting system. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our voting platform.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">2.1 Voter Information</h3>
                <p className="leading-relaxed">
                  We collect voter information from the Election Commission of India (ECI) database, including but not limited to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>EPIC (Electors Photo Identity Card) number</li>
                  <li>Full name and personal details</li>
                  <li>Age and gender</li>
                  <li>Address and constituency information</li>
                  <li>Polling station details</li>
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-medium text-white mb-2">2.2 Biometric Data</h3>
                <p className="leading-relaxed">
                  We collect and process facial recognition data for voter verification purposes. This biometric data is:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Stored securely using encryption</li>
                  <li>Used solely for identity verification</li>
                  <li>Not shared with third parties</li>
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-medium text-white mb-2">2.3 Blockchain Transaction Data</h3>
                <p className="leading-relaxed">
                  When you cast a vote, the transaction is recorded on the blockchain. This includes:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Encrypted vote data (your actual vote choice remains anonymous)</li>
                  <li>Transaction hash and timestamp</li>
                  <li>Blockchain address (wallet address)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>To verify your identity and eligibility to vote</li>
              <li>To prevent duplicate voting and ensure election integrity</li>
              <li>To record your vote on the blockchain in an encrypted format</li>
              <li>To maintain transparency and auditability of the voting process</li>
              <li>To comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Encryption:</strong> All sensitive data is encrypted both in transit and at rest</li>
              <li><strong>Blockchain Security:</strong> Votes are recorded on a secure, immutable blockchain</li>
              <li><strong>Biometric Protection:</strong> Facial recognition data is stored using secure hashing algorithms</li>
              <li><strong>Access Controls:</strong> Strict access controls limit who can view or modify data</li>
              <li><strong>Regular Audits:</strong> We conduct regular security audits and assessments</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information. We may share information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>With the Election Commission of India for official election purposes</li>
              <li>When required by law or legal process</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a merger, acquisition, or sale of assets (with proper notice)</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Note: Some data, particularly blockchain transaction records, cannot be deleted due to the immutable nature of blockchain technology.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Blockchain transaction records are retained permanently due to the immutable nature of blockchain technology, which is essential for maintaining election transparency and auditability.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our voting platform is intended for eligible voters only. We do not knowingly collect information from individuals under the age of 18. If you believe we have collected information from a minor, please contact us immediately.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us through the official channels provided by the Election Commission of India or through our platform's support system.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
