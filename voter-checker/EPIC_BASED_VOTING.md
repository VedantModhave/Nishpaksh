# EPIC-Based Voting Implementation

## ✅ Changes Made

The voting system has been updated to ensure **one vote per EPIC number** instead of one vote per wallet address.

### 1. **Smart Contract Updates** (`contracts/ElectionVoting.sol`)
- Changed from `mapping(address => bool) hasVoted` to `mapping(uint256 => bool) hasVotedByEpic`
- Updated `vote()` function to accept `_epicHash` parameter
- Event now includes `epicHash`: `VoteCasted(address indexed voter, uint256 epicHash, uint256 candidateId, uint256 wardId)`
- Contract checks if EPIC hash has already voted before allowing vote

### 2. **Voting Service Updates** (`src/services/votingService.ts`)
- Added `hashEpicNumber()` function using keccak256 hash
- Updated `castVote()` to:
  - Accept `epicNumber` parameter
  - Hash EPIC number before sending to contract
  - Check if EPIC has already voted before attempting vote
- Added `checkEpicVotedStatus()` function to check if an EPIC has voted

### 3. **Dashboard Updates** (`src/app/dashboard/page.tsx`)
- Reads EPIC number from localStorage (set during voter verification)
- Checks vote status on page load
- Shows EPIC number and vote status in UI
- Disables vote buttons if EPIC has already voted
- Displays warning if EPIC number is missing

### 4. **Home Page Updates** (`src/app/page.tsx`)
- Stores EPIC number in localStorage after successful voter verification

### 5. **Results Service Updates** (`src/services/resultsService.ts`)
- Updated event parsing to handle new event structure with `epicHash`
- Fixed event argument indices (candidateId at index 2, wardId at index 3)

## 🚨 IMPORTANT: Contract Redeployment Required

**You MUST redeploy the smart contract** because the function signature has changed:

### Before:
```solidity
function vote(uint256 _candidateId, uint256 _wardId) external
```

### After:
```solidity
function vote(uint256 _epicHash, uint256 _candidateId, uint256 _wardId) external
```

## 📋 Deployment Steps

1. **Stop the current Hardhat node** (if running)

2. **Redeploy the contract:**
   ```bash
   cd voter-checker
   npm run deploy:local
   ```

3. **Update `.env.local`** with the new contract address (automatically done by deploy script)

4. **Restart your Next.js dev server:**
   ```bash
   npm run dev
   ```

5. **Clear browser localStorage** (or use a new browser session) to test fresh

## 🔐 How It Works

1. **Voter Verification:**
   - User enters EPIC number on home page
   - EPIC is verified via ECI API
   - EPIC number is stored in localStorage

2. **Voting Process:**
   - Dashboard reads EPIC from localStorage
   - EPIC number is hashed using keccak256
   - Contract checks if this EPIC hash has already voted
   - If not voted, vote is cast with EPIC hash
   - If already voted, user sees error message

3. **Uniqueness:**
   - Same EPIC number = Same hash = Can only vote once
   - Different wallets with same EPIC = Still only one vote
   - Different EPIC numbers = Different hashes = Can vote separately

## 🧪 Testing

1. **Test Same EPIC, Different Wallets:**
   - Verify EPIC: `ABC1234567`
   - Vote with Wallet 1 → ✅ Success
   - Switch to Wallet 2
   - Try to vote with same EPIC → ❌ "Already voted" error

2. **Test Different EPIC Numbers:**
   - Verify EPIC: `ABC1234567` → Vote → ✅ Success
   - Verify EPIC: `XYZ9876543` → Vote → ✅ Success (different EPIC)

3. **Test Missing EPIC:**
   - Go to dashboard without verifying EPIC
   - Should see warning and disabled vote buttons

## 📝 Notes

- EPIC numbers are hashed using keccak256 for privacy
- Hash is deterministic (same EPIC = same hash)
- EPIC number is stored in localStorage (can be cleared for testing)
- Contract address must be updated after redeployment

## 🔄 Migration from Old Contract

If you have votes on the old contract:
- Old votes were tracked by wallet address
- New votes will be tracked by EPIC hash
- You may need to migrate data or start fresh for testing

