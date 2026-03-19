'use client'

import Link from 'next/link'
import Image from 'next/image'
import ConnectWallet from '@/components/ConnectWallet'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-gray-400 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using the Nishpaksh blockchain voting platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To use this voting platform, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Be a registered voter with a valid EPIC (Electors Photo Identity Card) number</li>
              <li>Be at least 18 years of age</li>
              <li>Have a valid voter ID registered with the Election Commission of India</li>
              <li>Have access to a compatible device with internet connectivity</li>
              <li>Have a blockchain wallet (e.g., MetaMask) installed and configured</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              As a user of this platform, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Provide accurate and truthful information during voter verification</li>
              <li>Maintain the security and confidentiality of your wallet credentials</li>
              <li>Cast only one vote per election as per your eligibility</li>
              <li>Not attempt to manipulate, hack, or interfere with the voting system</li>
              <li>Not use the platform for any illegal or unauthorized purpose</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Voting Process</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">4.1 Verification</h3>
                <p className="leading-relaxed">
                  Before casting a vote, you must complete the identity verification process, which includes:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Entering your EPIC number and state</li>
                  <li>Completing CAPTCHA verification</li>
                  <li>Facial recognition verification</li>
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-medium text-white mb-2">4.2 Vote Casting</h3>
                <p className="leading-relaxed">
                  Once verified, you can cast your vote on the blockchain. Your vote is:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Encrypted and recorded on the blockchain</li>
                  <li>Immutable and cannot be changed once submitted</li>
                  <li>Anonymous (your identity is not linked to your vote choice)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Blockchain Transactions</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              When you cast a vote, you are initiating a blockchain transaction that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Requires payment of network fees (gas fees) to process</li>
              <li>Is recorded permanently on the blockchain</li>
              <li>Cannot be reversed or modified once confirmed</li>
              <li>May take time to confirm depending on network congestion</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              You are responsible for all transaction fees associated with your vote. We are not responsible for any losses due to network issues, wallet errors, or transaction failures.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Activities</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Attempt to vote multiple times using the same or different identities</li>
              <li>Use someone else's EPIC number or identity to vote</li>
              <li>Manipulate or attempt to manipulate the voting results</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Use automated systems, bots, or scripts to interact with the platform</li>
              <li>Reverse engineer or attempt to extract the source code</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              All content, features, and functionality of the Nishpaksh platform, including but not limited to text, graphics, logos, and software, are the property of Nishpaksh or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The platform is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties that the platform will be uninterrupted, secure, or error-free</li>
              <li>Warranties regarding the accuracy or reliability of any information</li>
            </ul>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, Nishpaksh and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless Nishpaksh, its operators, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the platform, violation of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the updated terms on this page and updating the "Last updated" date. Your continued use of the platform after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to terminate or suspend your access to the platform immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of India.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the official channels provided by the Election Commission of India or through our platform's support system.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
