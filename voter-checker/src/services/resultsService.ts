import { ethers } from 'ethers'

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

// Contract ABI for reading vote data
const VOTING_ABI = [
  'function candidates(uint256) view returns (uint256 id, string memory name, uint256 voteCount)',
  'function hasVotedByEpic(uint256) view returns (bool)',
  'event VoteCasted(address indexed voter, uint256 epicHash, uint256 candidateId, uint256 wardId)',
  'function vote(uint256 _epicHash, uint256 _candidateId, uint256 _wardId) external',
]

export interface VoteTransaction {
  txHash: string
  blockNumber: number
  timestamp: number
  voter: string
  candidateId: bigint
  wardId: bigint
  status: 'Verified' | 'Confirming'
}

export interface CandidateVoteCount {
  candidateId: bigint
  name: string
  voteCount: bigint
}

export interface VotingStats {
  totalVotes: bigint
  blockHeight: number
  totalCandidates: number
  recentTransactions: VoteTransaction[]
}

export interface PartyVoteData {
  partyName: string
  votes: number
  seats: number
  percentage: number
  color: string
}

export interface GenderDistribution {
  male: number
  female: number
  other: number
}

export interface AgeDistribution {
  ageRange: string
  count: number
}

async function getProvider() {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called in the browser')
  }
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()
  
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Please switch to Hardhat Local network (Chain ID: ${EXPECTED_CHAIN_ID})`)
  }

  return provider
}

export async function getVotingStats(): Promise<VotingStats> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)

  // Get current block number
  const blockNumber = await provider.getBlockNumber()
  const currentBlock = await provider.getBlock('latest')

  // Get recent VoteCasted events
  const filter = contract.filters.VoteCasted()
  const events = await contract.queryFilter(filter, Math.max(0, blockNumber - 1000), 'latest')

  // Process events into transactions
  const recentTransactions: VoteTransaction[] = await Promise.all(
    events.slice(-20).reverse().map(async (event) => {
      const block = await provider.getBlock(event.blockNumber)
      const eventLog = event as ethers.EventLog
      return {
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: block?.timestamp || 0,
        voter: eventLog.args[0] as string,
        candidateId: eventLog.args[2] as bigint, // epicHash is at index 1, candidateId at 2
        wardId: eventLog.args[3] as bigint, // wardId is at index 3
        status: 'Verified' as const,
      }
    })
  )

  // Count total votes (sum of all candidate vote counts)
  // We'll need to iterate through candidates, but since we don't know all IDs,
  // we'll use the events to count unique votes
  const totalVotes = BigInt(events.length)

  // Count unique candidates from events
  const uniqueCandidates = new Set<string>()
  events.forEach((event) => {
    const eventLog = event as ethers.EventLog
    uniqueCandidates.add(eventLog.args[2].toString()) // Updated: candidateId is now at index 2
  })

  return {
    totalVotes,
    blockHeight: blockNumber,
    totalCandidates: uniqueCandidates.size,
    recentTransactions,
  }
}

export async function getCandidateVoteCounts(candidateIds: (string | number | bigint)[]): Promise<CandidateVoteCount[]> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)

  const voteCounts = await Promise.all(
    candidateIds.map(async (id) => {
      try {
        const candidateId = typeof id === 'bigint' ? id : BigInt(id.toString())
        const candidate = await contract.candidates(candidateId)
        return {
          candidateId: candidate.id,
          name: candidate.name || `Candidate ${candidateId}`,
          voteCount: candidate.voteCount,
        }
      } catch (error) {
        // Candidate might not exist yet, return zero votes
        const candidateId = typeof id === 'bigint' ? id : BigInt(id.toString())
        return {
          candidateId,
          name: `Candidate ${candidateId}`,
          voteCount: BigInt(0),
        }
      }
    })
  )

  return voteCounts
}

export async function getTransactionDetails(txHash: string): Promise<VoteTransaction | null> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)

  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) return null

    const block = await provider.getBlock(receipt.blockNumber)
    const logs = receipt.logs.filter((log) => log.address.toLowerCase() === VOTING_CONTRACT_ADDRESS.toLowerCase())
    
    if (logs.length === 0) return null

    const event = contract.interface.parseLog(logs[0])
    if (!event || event.name !== 'VoteCasted') return null

    return {
      txHash,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp || 0,
      voter: event.args[0] as string,
      candidateId: event.args[2] as bigint, // Updated: candidateId is now at index 2
      wardId: event.args[3] as bigint, // Updated: wardId is now at index 3
      status: receipt.status === 1 ? 'Verified' : 'Confirming',
    }
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return null
  }
}

export function formatTimestamp(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Fetch all candidates from Supabase and calculate party vote counts
export async function getPartyVoteData(): Promise<PartyVoteData[]> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)

  // Get all VoteCasted events
  const filter = contract.filters.VoteCasted()
  const blockNumber = await provider.getBlockNumber()
  const events = await contract.queryFilter(filter, Math.max(0, blockNumber - 10000), 'latest')

  // Fetch all candidates from Supabase
  const supabaseUrl = 'https://kvixkemyrydjihzqwaat.supabase.co/rest/v1/bmc_candidates?select=id,party_name'
  const headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aXhrZW15cnlkamloenF3YWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU2MTEsImV4cCI6MjA4MzExMTYxMX0.3CaKW2n-IH9uOJOB_RJU8cSAF-Toq1wCc43u5QLTJCQ",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aXhrZW15cnlkamloenF3YWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU2MTEsImV4cCI6MjA4MzExMTYxMX0.3CaKW2n-IH9uOJOB_RJU8cSAF-Toq1wCc43u5QLTJCQ"
  }

  let candidates: any[] = []
  try {
    // Use fetchWithCache for offline support (short TTL since results change frequently)
    const { fetchWithCache } = await import('@/utils/fetchWithCache')
    candidates = await fetchWithCache<any[]>(supabaseUrl, {
      headers,
      cacheTTL: 5 * 60 * 1000, // 5 minutes - results change as votes come in
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    // If offline and no cache, candidates will be empty array
  }

  // Create a map of candidate ID to party name
  const candidateToParty = new Map<string, string>()
  candidates.forEach((candidate: any) => {
    // Convert UUID to uint256 (same logic as votingService)
    let candidateId: string
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(candidate.id)) {
      const hex = candidate.id.replace(/-/g, '')
      candidateId = BigInt('0x' + hex).toString()
    } else {
      candidateId = candidate.id.toString()
    }
    candidateToParty.set(candidateId, candidate.party_name || 'Independent')
  })

  // Count votes per party
  const partyVotes = new Map<string, number>()
  events.forEach((event) => {
    const eventLog = event as ethers.EventLog
    const candidateId = eventLog.args[2].toString() // candidateId is at index 2
    const partyName = candidateToParty.get(candidateId) || 'Others'
    partyVotes.set(partyName, (partyVotes.get(partyName) || 0) + 1)
  })

  // Calculate total votes
  const totalVotes = Array.from(partyVotes.values()).reduce((sum, votes) => sum + votes, 0)
  if (totalVotes === 0) return []

  // Party colors mapping
  const partyColors: { [key: string]: string } = {
    'Bharatiya Janata Party': 'bg-orange-500',
    'BJP': 'bg-orange-500',
    'Indian National Congress': 'bg-cyan-500',
    'Congress': 'bg-cyan-500',
    'Aam Aadmi Party': 'bg-green-500',
    'AAP': 'bg-green-500',
    'Shiv Sena': 'bg-blue-500',
    'Shiv Sena (Uddhav Balasaheb Thackeray)': 'bg-blue-500',
    'Nationalist Congress Party': 'bg-purple-500',
    'NCP': 'bg-purple-500',
    'Maharashtra Navnirman Sena': 'bg-yellow-500',
    'MNS': 'bg-yellow-500',
    'Bahujan Samaj Party': 'bg-pink-500',
    'Samajwadi Party': 'bg-red-500',
    'Janata Dal (Secular)': 'bg-indigo-500',
    'JDS': 'bg-indigo-500',
  }

  // Convert to array and calculate percentages and seats
  const TOTAL_SEATS = 543
  const partyData: PartyVoteData[] = Array.from(partyVotes.entries())
    .map(([partyName, votes]) => {
      const percentage = (votes / totalVotes) * 100
      const seats = Math.round((votes / totalVotes) * TOTAL_SEATS)
      const color = partyColors[partyName] || 'bg-gray-500'
      
      return {
        partyName,
        votes,
        seats,
        percentage,
        color,
      }
    })
    .sort((a, b) => b.votes - a.votes) // Sort by votes descending

  return partyData
}

// Get gender distribution from stored voter data linked to blockchain votes
export async function getGenderDistribution(): Promise<GenderDistribution> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)
  
  const filter = contract.filters.VoteCasted()
  const blockNumber = await provider.getBlockNumber()
  const events = await contract.queryFilter(filter, Math.max(0, blockNumber - 10000), 'latest')
  
  let male = 0
  let female = 0
  let other = 0
  
  // Get EPIC hash mappings from localStorage
  if (typeof window !== 'undefined') {
    try {
      const mappingsStr = localStorage.getItem('epicHashMappings')
      const mappings = mappingsStr ? JSON.parse(mappingsStr) : {}
      
      // Match each vote event with stored voter data
      events.forEach((event) => {
        const eventLog = event as ethers.EventLog
        const epicHashBigInt = eventLog.args[1] as bigint
        const epicHashHex = '0x' + epicHashBigInt.toString(16).padStart(64, '0')
        const epicHashStr = epicHashBigInt.toString()
        
        // Try to find voter data by EPIC hash (try both hex and decimal string)
        const voterData = mappings[epicHashHex] || mappings[epicHashStr] || 
                         Object.values(mappings).find((m: any) => 
                           m.epicHash === epicHashHex || m.epicHash === epicHashStr
                         )
        
        if (voterData && voterData.gender) {
          const gender = String(voterData.gender).toUpperCase()
          if (gender === 'M' || gender === 'MALE') {
            male++
          } else if (gender === 'F' || gender === 'FEMALE') {
            female++
          } else {
            other++
          }
        }
      })
      
      // Fallback: if no matches found, use aggregated demographics
      if (male === 0 && female === 0 && other === 0) {
        const storedDemographics = localStorage.getItem('voterDemographics')
        if (storedDemographics) {
          const demographics = JSON.parse(storedDemographics)
          male = demographics.male || 0
          female = demographics.female || 0
          other = demographics.other || 0
        }
      }
    } catch (error) {
      console.error('Error reading voter demographics:', error)
    }
  }
  
  return {
    male,
    female,
    other,
  }
}

// Get age distribution from stored voter data linked to blockchain votes
export async function getAgeDistribution(): Promise<AgeDistribution[]> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)
  
  const filter = contract.filters.VoteCasted()
  const blockNumber = await provider.getBlockNumber()
  const events = await contract.queryFilter(filter, Math.max(0, blockNumber - 10000), 'latest')
  
  // Initialize age ranges
  const ageRanges = [
    { ageRange: '18-25', count: 0 },
    { ageRange: '26-35', count: 0 },
    { ageRange: '36-45', count: 0 },
    { ageRange: '46-55', count: 0 },
    { ageRange: '56-65', count: 0 },
    { ageRange: '65+', count: 0 },
  ]
  
  // Get EPIC hash mappings from localStorage
  if (typeof window !== 'undefined') {
    try {
      const mappingsStr = localStorage.getItem('epicHashMappings')
      const mappings = mappingsStr ? JSON.parse(mappingsStr) : {}
      
      // Match each vote event with stored voter data
      events.forEach((event) => {
        const eventLog = event as ethers.EventLog
        const epicHashBigInt = eventLog.args[1] as bigint
        const epicHashHex = '0x' + epicHashBigInt.toString(16).padStart(64, '0')
        const epicHashStr = epicHashBigInt.toString()
        
        // Try to find voter data by EPIC hash (try both hex and decimal string)
        const voterData = mappings[epicHashHex] || mappings[epicHashStr] || 
                         Object.values(mappings).find((m: any) => 
                           m.epicHash === epicHashHex || m.epicHash === epicHashStr
                         )
        
        if (voterData && voterData.age) {
          const age = typeof voterData.age === 'string' ? parseInt(voterData.age) : voterData.age
          if (!isNaN(age) && age > 0) {
            if (age >= 18 && age <= 25) ageRanges[0].count++
            else if (age >= 26 && age <= 35) ageRanges[1].count++
            else if (age >= 36 && age <= 45) ageRanges[2].count++
            else if (age >= 46 && age <= 55) ageRanges[3].count++
            else if (age >= 56 && age <= 65) ageRanges[4].count++
            else if (age > 65) ageRanges[5].count++
          }
        }
      })
      
      // Fallback: if no matches found, use aggregated demographics
      const totalCount = ageRanges.reduce((sum, range) => sum + range.count, 0)
      if (totalCount === 0) {
        const storedDemographics = localStorage.getItem('voterDemographics')
        if (storedDemographics) {
          const demographics = JSON.parse(storedDemographics)
          const ages = demographics.ages || []
          
          // Count ages into ranges
          ages.forEach((age: number) => {
            if (age >= 18 && age <= 25) ageRanges[0].count++
            else if (age >= 26 && age <= 35) ageRanges[1].count++
            else if (age >= 36 && age <= 45) ageRanges[2].count++
            else if (age >= 46 && age <= 55) ageRanges[3].count++
            else if (age >= 56 && age <= 65) ageRanges[4].count++
            else if (age > 65) ageRanges[5].count++
          })
        }
      }
    } catch (error) {
      console.error('Error reading age data:', error)
    }
  }
  
  return ageRanges
}

// Get NOTA (None of the Above) vote count
export async function getNotaVoteCount(): Promise<number> {
  const provider = await getProvider()
  const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)
  
  const filter = contract.filters.VoteCasted()
  const blockNumber = await provider.getBlockNumber()
  const events = await contract.queryFilter(filter, Math.max(0, blockNumber - 10000), 'latest')
  
  // Count votes where candidateId is 0 (NOTA)
  let notaCount = 0
  events.forEach((event) => {
    const eventLog = event as ethers.EventLog
    const candidateId = eventLog.args[2] as bigint // candidateId is at index 2
    if (candidateId === BigInt(0)) {
      notaCount++
    }
  })
  
  return notaCount
}

