const hre = require('hardhat')
const { ethers } = require('ethers')

async function main() {
  try {
    // Connect to local network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
    
    // Check if network is accessible
    const blockNumber = await provider.getBlockNumber()
    console.log('✅ Connected to Hardhat network. Current block:', blockNumber)
    
    // Get contract address from env
    const contractAddress = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
    console.log('📋 Contract address:', contractAddress)
    
    // Get contract code
    const code = await provider.getCode(contractAddress)
    if (code === '0x') {
      console.error('❌ No contract found at address:', contractAddress)
      console.log('💡 Run: npm run deploy:local')
      process.exit(1)
    }
    console.log('✅ Contract found at address')
    
    // Test contract ABI
    const abi = [
      'function vote(uint256 _epicHash, uint256 _candidateId, uint256 _wardId) external',
      'function hasVotedByEpic(uint256) view returns (bool)',
    ]
    
    const contract = new ethers.Contract(contractAddress, abi, provider)
    
    // Test hasVotedByEpic function
    const testHash = ethers.keccak256(ethers.toUtf8Bytes('TEST123'))
    const testHashBigInt = BigInt(testHash)
    
    try {
      const hasVoted = await contract.hasVotedByEpic(testHashBigInt)
      console.log('✅ hasVotedByEpic function works. Test hash voted:', hasVoted)
    } catch (err) {
      console.error('❌ Error calling hasVotedByEpic:', err.message)
    }
    
    console.log('\n✅ Contract is properly deployed and accessible!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Hardhat node is not running. Start it with: npm run chain')
    }
    process.exit(1)
  }
}

main()

