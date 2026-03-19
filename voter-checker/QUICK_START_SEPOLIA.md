# Quick Start: Sepolia Testnet Setup

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Sepolia ETH
Visit https://sepoliafaucet.com/ and get free testnet ETH (you'll need ~0.1 ETH)

### Step 2: Get Your Private Key
1. Open MetaMask → Click account menu (⋮) → Account details → Show private key
2. Copy your private key (keep it secure!)

### Step 3: Configure Environment
Create/update `voter-checker/.env.local`:
```bash
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=paste_your_private_key_here
NEXT_PUBLIC_VOTING_CHAIN_ID=11155111
```

### Step 4: Deploy Contract
```bash
cd voter-checker
npm run deploy:sepolia
```

### Step 5: Start Application
```bash
npm run dev
```

### Step 6: Connect MetaMask
1. Open http://localhost:3000
2. Connect MetaMask
3. Switch to Sepolia network (if not already)
4. Start voting!

## ✅ Verification Checklist

- [ ] Have Sepolia ETH in MetaMask
- [ ] `.env.local` configured with PRIVATE_KEY
- [ ] Contract deployed successfully
- [ ] MetaMask connected to Sepolia network
- [ ] Application running on localhost:3000

## 🔄 Switching Between Networks

**To Sepolia:**
```bash
npm run deploy:sepolia
# Make sure NEXT_PUBLIC_VOTING_CHAIN_ID=11155111 in .env.local
```

**To Local Hardhat:**
```bash
npm run chain  # Terminal 1
npm run deploy:local  # Terminal 2
# Make sure NEXT_PUBLIC_VOTING_CHAIN_ID=31337 in .env.local
```

## 📋 What Gets Deployed

- **Contract**: `ElectionVoting.sol`
- **Functions**: 
  - `vote(uint256 _epicHash, uint256 _candidateId, uint256 _wardId)`
  - `hasVotedByEpic(uint256) view returns (bool)`
- **Events**: `VoteCasted(address indexed voter, uint256 epicHash, uint256 candidateId, uint256 wardId)`

## 🔍 View on Etherscan

After deployment, you'll get a contract address. View it on:
`https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

## 💡 Tips

- **Gas Fees**: Sepolia transactions cost testnet ETH (free from faucets)
- **Transaction Speed**: Usually confirms in 10-30 seconds
- **Persistence**: Contract and votes persist forever on Sepolia
- **Public**: Anyone can view your contract and transactions

## 🆘 Troubleshooting

**"Insufficient funds"**: Get more Sepolia ETH from faucet

**"Wrong network"**: Switch MetaMask to Sepolia network

**"Contract not found"**: Redeploy with `npm run deploy:sepolia`

**"Transaction failed"**: Check browser console (F12) for details

## 📚 Full Documentation

See [SEPOLIA_SETUP.md](./SEPOLIA_SETUP.md) for detailed guide.

