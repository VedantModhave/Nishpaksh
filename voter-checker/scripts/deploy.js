const fs = require('fs')
const path = require('path')

function upsertEnvLocal(projectRoot, key, value) {
  const envPath = path.join(projectRoot, '.env.local')
  let existing = ''
  try {
    existing = fs.readFileSync(envPath, 'utf8')
  } catch {
    existing = ''
  }

  const line = `${key}=${value}`
  if (!existing.trim()) {
    fs.writeFileSync(envPath, line + '\n', 'utf8')
    return
  }

  const lines = existing.split(/\r?\n/)
  let replaced = false
  const next = lines.map((l) => {
    if (l.startsWith(key + '=')) {
      replaced = true
      return line
    }
    return l
  })
  if (!replaced) next.push(line)
  fs.writeFileSync(envPath, next.filter((l, i, arr) => !(l === '' && i === arr.length - 1)).join('\n') + '\n', 'utf8')
}

async function main() {
  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  
  console.log('Deploying to network:', network)
  console.log('Deploying with account:', deployer.address)
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH')
  
  if (network === 'sepolia' && balance === BigInt(0)) {
    console.error('❌ Error: No ETH in account for Sepolia deployment')
    console.log('💡 Get Sepolia ETH from: https://sepoliafaucet.com/')
    process.exit(1)
  }

  const Factory = await hre.ethers.getContractFactory('ElectionVoting')
  console.log('Deploying contract...')
  
  const contract = await Factory.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('✅ ElectionVoting deployed to:', address)
  
  if (network === 'sepolia') {
    console.log('📋 View on Etherscan:', `https://sepolia.etherscan.io/address/${address}`)
  }

  // Write into Next.js env so the frontend picks it up
  upsertEnvLocal(process.cwd(), 'NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS', address)
  upsertEnvLocal(process.cwd(), 'NEXT_PUBLIC_VOTING_CHAIN_ID', network === 'sepolia' ? '11155111' : '31337')
  console.log('✅ Updated .env.local with contract address and chain ID')
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

