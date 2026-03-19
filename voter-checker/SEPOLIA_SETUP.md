# Sepolia Testnet Setup Guide

This guide will help you deploy and run the voting system on Sepolia testnet instead of local Hardhat network.

## Prerequisites

1. **MetaMask Extension** installed in your browser
2. **Sepolia ETH** in your MetaMask wallet (get from faucets below)
3. **Private Key** of your MetaMask account (for deployment)

## Step 1: Get Sepolia ETH

You need Sepolia ETH to pay for gas fees. Get free testnet ETH from:

- **Alchemy Sepolia Faucet**: https://sepoliafaucet.com/
- **Infura Sepolia Faucet**: https://www.infura.io/faucet/sepolia
- **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
- **PoW Faucet**: https://sepolia-faucet.pk910.de/

**Note**: You'll need at least 0.1 Sepolia ETH for deployment and voting transactions.

## Step 2: Get Your Private Key

1. Open MetaMask
2. Click the three dots (⋮) next to your account name
3. Click "Account details"
4. Click "Show private key"
5. Enter your password
6. Copy the private key (keep it secure!)

## Step 3: Configure Environment Variables

Create or update `.env.local` file in the `voter-checker` directory:

```bash
# Sepolia Network Configuration
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here

# Contract address (will be set automatically after deployment)
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=
NEXT_PUBLIC_VOTING_CHAIN_ID=11155111
```

**Important**: 
- Replace `your_private_key_here` with your actual MetaMask private key
- Never commit `.env.local` to git (it's already in .gitignore)
- Keep your private key secure!

## Step 4: Deploy Contract to Sepolia

Run the deployment command:

```bash
cd voter-checker
npm run deploy:sepolia
```

This will:
1. Deploy the contract to Sepolia testnet
2. Automatically update `.env.local` with the contract address
3. Set the chain ID to 11155111 (Sepolia)

**Expected Output:**
```
Deploying to network: sepolia
Deploying with account: 0xYourAddress...
Account balance: 0.5 ETH
Deploying contract...
✅ ElectionVoting deployed to: 0xContractAddress...
📋 View on Etherscan: https://sepolia.etherscan.io/address/0xContractAddress...
✅ Updated .env.local with contract address and chain ID
```

## Step 5: Verify Deployment

1. Copy the contract address from the deployment output
2. Visit: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`
3. You should see your contract on Sepolia Etherscan

## Step 6: Update Frontend

Restart your Next.js dev server to pick up the new environment variables:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Step 7: Connect MetaMask to Sepolia

1. Open MetaMask
2. Click the network dropdown (top of MetaMask)
3. Select "Sepolia" network
4. If Sepolia is not listed:
   - Click "Add Network"
   - Or use "Show test networks" toggle
   - Sepolia should appear in the list

## Step 8: Test Voting

1. Open your application in the browser
2. Verify your voter ID (EPIC number)
3. Select a candidate and vote
4. MetaMask will prompt you to confirm the transaction
5. Click "Confirm" and wait for transaction confirmation
6. Check your transaction on Etherscan

## Switching Between Networks

### To use Sepolia:
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Make sure .env.local has:
NEXT_PUBLIC_VOTING_CHAIN_ID=11155111
```

### To use Local Hardhat:
```bash
# Start Hardhat node
npm run chain

# In another terminal, deploy locally
npm run deploy:local

# Make sure .env.local has:
NEXT_PUBLIC_VOTING_CHAIN_ID=31337
```

## Troubleshooting

### Issue: "Insufficient funds"
**Solution**: Get more Sepolia ETH from the faucets listed above.

### Issue: "Wrong network"
**Solution**: 
- Make sure MetaMask is connected to Sepolia network
- Check that `NEXT_PUBLIC_VOTING_CHAIN_ID=11155111` in `.env.local`
- Restart your dev server

### Issue: "Contract not found"
**Solution**:
- Verify contract address in `.env.local` matches deployed address
- Check Etherscan to confirm contract exists
- Redeploy if necessary: `npm run deploy:sepolia`

### Issue: "Transaction failed"
**Solution**:
- Check you have enough Sepolia ETH for gas
- Verify you're on Sepolia network in MetaMask
- Check browser console for detailed errors

## Benefits of Using Sepolia

✅ **Real blockchain**: Transactions are on a public testnet
✅ **Etherscan integration**: View all transactions on Etherscan
✅ **No local setup**: No need to run Hardhat node
✅ **Persistent data**: Contract and votes persist across sessions
✅ **Public access**: Anyone can interact with your deployed contract
✅ **Realistic testing**: Closer to mainnet environment

## Security Notes

⚠️ **Never use your mainnet private key**
⚠️ **Never commit private keys to git**
⚠️ **Sepolia ETH has no real value** - it's for testing only
⚠️ **Contract is public** - anyone can view and interact with it

## Next Steps

After successful deployment:
1. Share the contract address with your team
2. Share the Etherscan link for transparency
3. Test all voting functionality
4. Monitor transactions on Etherscan
5. Consider adding more features or upgrading the contract

## Useful Links

- **Sepolia Etherscan**: https://sepolia.etherscan.io/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **MetaMask**: https://metamask.io/
- **Hardhat Docs**: https://hardhat.org/docs

