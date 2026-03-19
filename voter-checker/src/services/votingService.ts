import { ethers } from 'ethers'
import { offlineVoteStorage } from './offlineVoteStorage'

declare global {
  interface Window {
    ethereum?: any
  }
}

const VOTING_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS ??
  '0x0000000000000000000000000000000000000000'

const EXPECTED_CHAIN_ID = BigInt(
  process.env.NEXT_PUBLIC_VOTING_CHAIN_ID ?? '31337'
)

// Sepolia network configuration
const SEPOLIA_CHAIN_ID = BigInt(11155111)
const SEPOLIA_NETWORK_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}

// Minimal ABI needed for the plan
const VOTING_ABI = [
  'function vote(uint256 _epicHash, uint256 _candidateId, uint256 _wardId) external',
  'function hasVotedByEpic(uint256) view returns (bool)',
  'event VoteCasted(address indexed voter, uint256 epicHash, uint256 candidateId, uint256 wardId)',
]

function isUuidLike(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  )
}

function toUint256(value: string | number | bigint): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid number')
    return BigInt(Math.floor(value))
  }

  const s = String(value).trim()
  if (/^\d+$/.test(s)) return BigInt(s)

  // If Supabase IDs are UUIDs, we can still pass a deterministic uint256 by
  // converting UUID hex to a 128-bit integer (valid within uint256).
  if (isUuidLike(s)) {
    const hex = s.replace(/-/g, '')
    return BigInt('0x' + hex)
  }

  throw new Error(`Candidate id "${s}" is not a uint or UUID`)
}

// Hash EPIC number to uint256 for storage in contract
function hashEpicNumber(epicNumber: string): bigint {
  // Use keccak256 hash of EPIC number (uppercase, trimmed)
  const normalizedEpic = epicNumber.toUpperCase().trim()
  const hash = ethers.keccak256(ethers.toUtf8Bytes(normalizedEpic))
  // Convert hex string directly to BigInt (ethers.keccak256 returns hex with 0x prefix)
  return BigInt(hash)
}

export async function castVote(params: {
  epicNumber: string
  candidateId: string | number | bigint
  wardId: string | number | bigint
  candidateName?: string // Optional: for display in offline queue
  forceOnline?: boolean // If true, will throw error when offline instead of queueing
}) {
  if (typeof window === 'undefined') {
    throw new Error('Voting is only available in the browser')
  }

  // Check if device is online
  const isOnline = navigator.onLine

  // If offline and not forcing online, queue the vote
  if (!isOnline && !params.forceOnline) {
    console.log('Device is offline, queueing vote for later sync...')
    
    try {
      const voteId = await offlineVoteStorage.queueVote({
        epicNumber: params.epicNumber,
        candidateId: params.candidateId,
        wardId: params.wardId,
        candidateName: params.candidateName,
      })
      
      // Return a special response indicating the vote was queued
      return {
        txHash: null,
        receipt: null,
        queued: true,
        queueId: voteId,
      } as any
    } catch (error: any) {
      throw new Error(`Failed to queue vote offline: ${error.message || error}`)
    }
  }

  // If offline but forceOnline is true, throw error
  if (!isOnline && params.forceOnline) {
    throw new Error('Device is offline. Please connect to the internet to vote.')
  }

  if (!window.ethereum) {
    throw new Error('MetaMask not found (window.ethereum missing)')
  }
  if (
    !VOTING_CONTRACT_ADDRESS ||
    VOTING_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'
  ) {
    throw new Error(
      'Missing contract address. Set NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS.'
    )
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])

  // Safety: make sure the wallet is on the expected chain
  try {
    const net = await provider.getNetwork()
    if (net.chainId !== EXPECTED_CHAIN_ID) {
      const hexChainId = '0x' + EXPECTED_CHAIN_ID.toString(16)
      
      // Determine network configuration based on chain ID
      const isSepolia = EXPECTED_CHAIN_ID === SEPOLIA_CHAIN_ID
      const networkConfig = isSepolia 
        ? SEPOLIA_NETWORK_CONFIG
        : {
            chainId: hexChainId,
            chainName: 'Hardhat Local',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['http://127.0.0.1:8545'],
            blockExplorerUrls: null,
          }
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        })
      } catch (switchErr: any) {
        // If the network doesn't exist (error code 4902), add it
        if (switchErr.code === 4902 || switchErr.message?.includes('does not exist')) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            })
            // After adding, try switching again
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: hexChainId }],
            })
          } catch (addErr: any) {
            const networkName = isSepolia ? 'Sepolia' : 'Hardhat Local'
            const rpcUrl = isSepolia ? 'https://rpc.sepolia.org' : 'http://127.0.0.1:8545'
            throw new Error(
              `Failed to add ${networkName} network. Please manually add it to MetaMask:\n` +
              `Chain ID: ${EXPECTED_CHAIN_ID.toString()}\n` +
              `RPC URL: ${rpcUrl}`
            )
          }
        } else {
          const networkName = isSepolia ? 'Sepolia' : 'Hardhat Local'
          throw new Error(
            `Wrong network. Switch MetaMask to ${networkName} (Chain ID: ${EXPECTED_CHAIN_ID.toString()}) and try again.`
          )
        }
      }
    }
  } catch (e: any) {
    // If provider.getNetwork fails, continue; MetaMask will still surface an error.
    // But we prefer a clear error when possible.
    const msg = e?.message
    if (msg) throw new Error(msg)
  }

  const signer = await provider.getSigner()
  
  // Verify signer has an account
  const signerAddress = await signer.getAddress()
  
  // Get current network info for debugging and error messages
  const currentNetwork = await provider.getNetwork()
  const currentChainId = currentNetwork.chainId
  console.log('Current network:', {
    chainId: currentChainId.toString(),
    name: currentNetwork.name || 'Unknown'
  })
  console.log('Signer address:', signerAddress)
  
  // Check balance
  const balance = await provider.getBalance(signerAddress)
  const balanceInEth = ethers.formatEther(balance)
  console.log('Signer balance:', balanceInEth, 'ETH')
  
  if (balance === BigInt(0)) {
    // Use the network info we already fetched
    const isSepolia = currentChainId === SEPOLIA_CHAIN_ID
    const isLocalHardhat = currentChainId === BigInt(31337)
    
    if (isSepolia) {
      throw new Error(
        'Your MetaMask account has no Sepolia ETH. Please get Sepolia ETH from a faucet:\n' +
        '1. Visit: https://sepoliafaucet.com/\n' +
        '2. Or: https://www.infura.io/faucet/sepolia\n' +
        '3. Enter your wallet address: ' + signerAddress + '\n' +
        '4. Request test ETH\n' +
        '5. Wait for confirmation and try again'
      )
    } else if (isLocalHardhat) {
      throw new Error(
        'Your MetaMask account has no ETH. Please import a funded test account.\n' +
        'Run: node scripts/get-test-accounts.js\n' +
        'Then import one of the private keys into MetaMask'
      )
    } else {
      throw new Error(
        'Your MetaMask account has no ETH for gas fees on the current network.\n' +
        'Network: Chain ID ' + currentChainId.toString() + '\n' +
        'Account: ' + signerAddress + '\n' +
        'Please add ETH to this account on this network.'
      )
    }
  }

  const contractAddress = ethers.getAddress(VOTING_CONTRACT_ADDRESS)
  const contract = new ethers.Contract(contractAddress, VOTING_ABI, signer)

  // Hash EPIC number and check if already voted
  const epicHash = hashEpicNumber(params.epicNumber)
  console.log('EPIC hash:', epicHash.toString())
  
  // Store EPIC hash -> voter data mapping for results aggregation
  if (typeof window !== 'undefined') {
    try {
      const epicUpper = params.epicNumber.toUpperCase()
      // Get stored voter data
      const voterDataStr = localStorage.getItem(`voterData_${epicUpper}`) || localStorage.getItem('voterData')
      if (voterDataStr) {
        const voterData = JSON.parse(voterDataStr)
        const epicHashStr = epicHash.toString()
        
        // Store mapping by EPIC hash
        const existingMappings = localStorage.getItem('epicHashMappings')
        const mappings = existingMappings ? JSON.parse(existingMappings) : {}
        
        const epicHashHex = '0x' + epicHash.toString(16).padStart(64, '0')
        if (!mappings[epicHashHex] && !mappings[epicHashStr]) {
          const mapping = {
            epicHash: epicHashHex, // Store as hex string
            epicHashBigInt: epicHashStr, // Also store as decimal string
            epicNumber: epicUpper,
            gender: voterData.gender || voterData.Gender || null,
            age: voterData.age || voterData.Age || null,
            fullData: voterData,
          }
          mappings[epicHashHex] = mapping
          mappings[epicHashStr] = mapping // Store by both keys for flexible matching
          localStorage.setItem('epicHashMappings', JSON.stringify(mappings))
        }
      }
    } catch (error) {
      console.error('Error storing EPIC hash mapping:', error)
    }
  }
  
  // Check if this EPIC has already voted (with error handling for old contracts)
  try {
    const hasVoted = await contract.hasVotedByEpic(epicHash)
    console.log('Has voted check result:', hasVoted)
    if (hasVoted) {
      throw new Error('This EPIC number has already voted. Each voter can only vote once.')
    }
  } catch (checkError: any) {
    // If the function doesn't exist (old contract), log warning but continue
    if (checkError.message?.includes('could not decode') || checkError.message?.includes('function does not exist')) {
      console.warn('Contract may not be updated. Proceeding with vote...')
    } else {
      // Re-throw if it's a real "already voted" error
      throw checkError
    }
  }

  const candidateId = toUint256(params.candidateId)
  const wardId = toUint256(params.wardId)
  console.log('Vote parameters:', {
    epicHash: epicHash.toString(),
    candidateId: candidateId.toString(),
    wardId: wardId.toString(),
    contractAddress,
  })
  
  // Validate parameters
  if (epicHash === BigInt(0)) {
    throw new Error('Invalid EPIC number hash')
  }
  // Allow candidate ID 0 for NOTA (None of the Above)
  // if (candidateId === BigInt(0)) {
  //   throw new Error('Invalid candidate ID')
  // }
  if (wardId === BigInt(0)) {
    throw new Error('Invalid ward ID')
  }

  // Try new signature first (with epicHash)
  try {
    // Estimate gas first to validate the call and get proper gas limit
    let gasEstimate
    try {
      gasEstimate = await contract.vote.estimateGas(epicHash, candidateId, wardId)
      console.log('Gas estimate:', gasEstimate.toString())
    } catch (estimateError: any) {
      // If estimation fails, check the reason
      const estimateMsg = estimateError.reason || estimateError.message || String(estimateError)
      if (estimateMsg.includes('already voted')) {
        throw new Error('This EPIC number has already voted. Each voter can only vote once.')
      }
      if (estimateMsg.includes('Invalid')) {
        throw new Error('Invalid vote parameters. Please check your selection and try again.')
      }
      // If estimation fails for other reasons, use a default gas limit
      console.warn('Gas estimation failed, using default:', estimateMsg)
      gasEstimate = BigInt(500000)
    }
    
    // Call the vote function with explicit gas limit
    const tx = await contract.vote(epicHash, candidateId, wardId, {
      gasLimit: gasEstimate + BigInt(50000), // Add buffer to gas estimate
    })
    const receipt = await tx.wait()
    return { txHash: tx.hash as string, receipt, queued: false }
  } catch (voteError: any) {
    // Log full error for debugging
    console.error('Vote error details:', {
      error: voteError,
      code: voteError.code,
      reason: voteError.reason,
      message: voteError.message,
      data: voteError.data,
      action: voteError.action,
    })
    
    // Handle specific error cases with better messages
    const errorMessage = voteError.reason || voteError.message || String(voteError)
    const errorCode = voteError.code
    
    // Check for user rejection (MetaMask user clicked reject)
    if (errorCode === 4001 || 
        errorCode === 'ACTION_REJECTED' ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.toLowerCase().includes('rejected')) {
      throw new Error('Transaction was rejected. Please click "Confirm" in MetaMask to approve the transaction.')
    }
    
    // Check for "already voted" errors
    if (errorMessage.includes('already voted') || 
        errorMessage.includes('has already voted') ||
        errorMessage.includes('This EPIC number has already voted')) {
      throw new Error('This EPIC number has already voted. Each voter can only vote once.')
    }
    
    // Check for invalid candidate errors (but allow NOTA which uses candidate ID 0)
    if (errorMessage.includes('Invalid candidate') || errorMessage.includes('Invalid EPIC')) {
      // If voting for NOTA (candidate ID 0), this might mean contract needs redeployment
      if (params.candidateId === BigInt(0) || params.candidateId === 0) {
        throw new Error(
          'NOTA voting requires contract redeployment. Please:\n' +
          '1. Stop Hardhat node (if running)\n' +
          '2. Run: npm run deploy:local\n' +
          '3. Restart your dev server\n' +
          '4. Try voting again'
        )
      }
      throw new Error('Invalid vote parameters. Please check your selection and try again.')
    }
    
    // Check for insufficient funds
    if (errorMessage.includes('insufficient funds') || 
        errorMessage.includes('insufficient balance') ||
        errorCode === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH for gas. Please add ETH to your MetaMask account.')
    }
    
    // Check for network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('chain') ||
        errorMessage.includes('network mismatch') ||
        errorCode === 'NETWORK_ERROR') {
      throw new Error('Network error. Please ensure MetaMask is connected to Hardhat Local network (Chain ID: 31337).')
    }
    
    // Check for contract mismatch errors
    if (errorMessage.includes('could not decode') || 
        errorMessage.includes('execution reverted') ||
        errorCode === 'CALL_EXCEPTION' ||
        errorCode === 'BAD_DATA') {
      // Check if it's a revert reason
      if (voteError.data) {
        try {
          const revertReason = contract.interface.parseError(voteError.data)
          throw new Error(`Transaction failed: ${revertReason?.name || 'Unknown error'}`)
        } catch {
          throw new Error(
            'Contract error. Please ensure:\n' +
            '1. Contract is deployed: npm run deploy:local\n' +
            '2. You are on the correct network (Hardhat Local)\n' +
            '3. Contract address is correct in .env.local'
          )
        }
      }
      throw new Error(
        'Contract error. Please ensure the contract is deployed correctly.\n' +
        'Run: npm run deploy:local'
      )
    }
    
    // Handle MetaMask specific errors
    if (errorMessage.includes('coalesce') || 
        errorMessage.includes('invalid transaction') ||
        errorCode === 'INVALID_ARGUMENT') {
      throw new Error(
        'Transaction format error. Please check:\n' +
        '1. MetaMask is connected\n' +
        '2. Network is Hardhat Local (Chain ID: 31337)\n' +
        '3. You have ETH for gas fees'
      )
    }
    
    // Handle gas estimation errors
    if (errorMessage.includes('gas') || errorCode === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error(
        'Gas estimation failed. This might mean:\n' +
        '1. The transaction would fail (check if EPIC already voted)\n' +
        '2. Network connection issue\n' +
        '3. Contract not deployed correctly'
      )
    }
    
    // Generic error fallback with more context
    const detailedError = errorMessage || 'Unknown error occurred'
    throw new Error(`Vote failed: ${detailedError}\n\nPlease check:\n1. MetaMask is connected and unlocked\n2. You are on Hardhat Local network\n3. You have ETH for gas\n4. Contract is deployed`)
  }
}

// Check if an EPIC number has already voted
export async function checkEpicVotedStatus(epicNumber: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called in the browser')
  }
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }
  if (
    !VOTING_CONTRACT_ADDRESS ||
    VOTING_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'
  ) {
    return false
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()
  
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    return false
  }

  const contractAddress = ethers.getAddress(VOTING_CONTRACT_ADDRESS)
  const contract = new ethers.Contract(contractAddress, VOTING_ABI, provider)

  const epicHash = hashEpicNumber(epicNumber)
  
  try {
    const hasVoted = await contract.hasVotedByEpic(epicHash)
    return hasVoted
  } catch (error: any) {
    // If function doesn't exist (old contract), return false
    if (error.message?.includes('could not decode') || error.message?.includes('function does not exist')) {
      console.warn('Contract may not support EPIC-based voting yet')
      return false
    }
    throw error
  }
}

