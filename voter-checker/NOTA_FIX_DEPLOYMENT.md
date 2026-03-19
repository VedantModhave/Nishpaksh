# NOTA Voting Fix - Deployment Instructions

## Problem
The deployed contract rejects NOTA votes (candidate ID 0) because it has the old code that checks `require(_candidateId != 0, "Invalid candidate")`.

## Solution
Redeploy the contract with the updated code that allows NOTA (candidate ID 0).

## Steps to Fix

### Option 1: Local Hardhat Network (Recommended for Testing)

1. **Start Hardhat Node** (in Terminal 1):
   ```bash
   cd voter-checker
   npm run chain
   ```
   Keep this terminal running.

2. **Deploy Contract** (in Terminal 2):
   ```bash
   cd voter-checker
   npm run deploy:local
   ```
   
   This will:
   - Compile the updated contract
   - Deploy it to local Hardhat network
   - Update `.env.local` with the new contract address

3. **Restart Next.js Dev Server**:
   ```bash
   # Stop current dev server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

4. **Test NOTA Voting**:
   - Go to dashboard
   - Click "Select NOTA"
   - Confirm vote
   - Should work now! ✅

### Option 2: Sepolia Testnet (Production-like)

1. **Deploy to Sepolia**:
   ```bash
   cd voter-checker
   npm run deploy:sepolia
   ```

2. **Update MetaMask**:
   - Switch to Sepolia network
   - Make sure you have Sepolia ETH for gas

3. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

## What Changed

### Smart Contract (`contracts/ElectionVoting.sol`)
- ✅ Removed `require(_candidateId != 0, "Invalid candidate")`
- ✅ Added NOTA initialization logic
- ✅ Allows candidate ID 0 for NOTA votes

### Voting Service (`src/services/votingService.ts`)
- ✅ Removed validation that blocked candidate ID 0
- ✅ Improved error messages for NOTA-specific errors

## Verification

After redeployment, you can verify the contract works by:

1. **Check Contract Address**:
   ```bash
   cat .env.local | grep VOTING_CONTRACT_ADDRESS
   ```

2. **Test NOTA Vote**:
   - Cast a NOTA vote
   - Should succeed without "Invalid candidate ID" error

3. **Check Results**:
   - Go to Results page
   - NOTA count should increment

## Troubleshooting

### Error: "Cannot connect to network localhost"
- **Solution**: Start Hardhat node first (`npm run chain`)

### Error: "Contract error. Please ensure contract is deployed"
- **Solution**: Run `npm run deploy:local` after starting Hardhat node

### Error: "Invalid candidate ID" still appears
- **Solution**: 
  1. Make sure you redeployed the contract
  2. Restart your Next.js dev server
  3. Clear browser cache/localStorage if needed

### Contract address didn't update
- **Solution**: Check `.env.local` manually and update `NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS` if needed

## Notes

- The old contract address will no longer work for NOTA votes
- All existing votes on the old contract remain valid
- New votes must use the redeployed contract
- If you have important test data, you may want to note the old contract address

---

**After redeployment, NOTA voting should work perfectly! 🎉**

