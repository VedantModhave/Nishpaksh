// Script to display Hardhat test accounts for importing into MetaMask
// Run this while Hardhat node is running: node scripts/get-test-accounts.js

const { ethers } = require('ethers')

async function main() {
  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
  
  console.log('\n🔑 Hardhat Test Accounts (for MetaMask import)\n')
  console.log('=' .repeat(80))
  
  // Hardhat's default accounts (first 5)
  const accounts = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c3c5c3c5c3c5c3c5c3c5c3c',
  ]
  
  // Hardhat's default private keys (first 5)
  const privateKeys = [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d2',
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  ]
  
  for (let i = 0; i < 5; i++) {
    try {
      const balance = await provider.getBalance(accounts[i])
      const balanceInEth = ethers.formatEther(balance)
      
      console.log(`\n📝 Account ${i + 1}:`)
      console.log(`   Address: ${accounts[i]}`)
      console.log(`   Private Key: ${privateKeys[i]}`)
      console.log(`   Balance: ${balanceInEth} ETH`)
      console.log(`   ────────────────────────────────────────────────────────────────`)
    } catch (error) {
      console.log(`\n❌ Error fetching account ${i + 1}:`, error.message)
    }
  }
  
  console.log('\n\n📋 How to Import into MetaMask:')
  console.log('1. Open MetaMask extension')
  console.log('2. Click the account icon (top right)')
  console.log('3. Select "Import Account"')
  console.log('4. Paste one of the private keys above')
  console.log('5. Click "Import"')
  console.log('\n✅ The account will have 10,000 ETH for testing!\n')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

