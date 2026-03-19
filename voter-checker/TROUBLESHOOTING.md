# Troubleshooting Voting Issues

## "Transaction was rejected" Error

If you see this error, here's how to fix it:

### Step 1: Check MetaMask Popup
1. **Look for MetaMask popup** - It might be hidden behind your browser window
2. **Check MetaMask extension icon** - Click the MetaMask icon in your browser toolbar
3. **Look for pending transactions** - There might be a transaction waiting for approval
4. **Click "Confirm"** - Make sure you're clicking "Confirm" not "Reject"

### Step 2: Verify Network Connection
1. Open MetaMask
2. Check the network dropdown at the top
3. It should show **"Hardhat Local"** or **"Localhost 8545"**
4. If not, switch to it or add it:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

### Step 3: Check Your ETH Balance
1. Open MetaMask
2. Check your ETH balance (should be > 0)
3. If you have 0 ETH, import a funded test account:
   ```bash
   cd voter-checker
   node scripts/get-test-accounts.js
   ```
4. Copy a private key and import it into MetaMask

### Step 4: Verify Hardhat Node is Running
1. Check if Hardhat node is running:
   ```bash
   cd voter-checker
   npm run chain
   ```
2. It should show "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"
3. Keep this terminal window open

### Step 5: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check for:
   - "EPIC hash: ..." - Should show a hash
   - "Vote parameters: ..." - Should show candidateId, wardId, epicHash
   - "Gas estimate: ..." - Should show a number
   - Any red error messages

### Step 6: Verify Contract is Deployed
1. Check if contract is deployed:
   ```bash
   cd voter-checker
   node scripts/test-contract.js
   ```
2. Should show: "✅ Contract is properly deployed and accessible!"

### Step 7: Common Issues and Solutions

#### Issue: "User rejected transaction"
**Solution:** You clicked "Reject" in MetaMask. Try again and click "Confirm".

#### Issue: "Insufficient funds"
**Solution:** Import a funded test account (see Step 3).

#### Issue: "Network error"
**Solution:** 
- Ensure Hardhat node is running
- Switch MetaMask to Hardhat Local network
- Check RPC URL is `http://127.0.0.1:8545`

#### Issue: "Contract error" or "could not decode"
**Solution:**
- Redeploy contract: `npm run deploy:local`
- Restart dev server: `npm run dev`
- Clear browser cache and reload

#### Issue: "This EPIC number has already voted"
**Solution:** This EPIC has already voted. Use a different EPIC number for testing.

### Step 8: Test Transaction Manually
If still not working, try this in browser console:
```javascript
// Check if MetaMask is connected
if (typeof window.ethereum !== 'undefined') {
  console.log('MetaMask found')
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  console.log('Connected accounts:', accounts)
} else {
  console.error('MetaMask not found')
}
```

### Still Not Working?
1. **Restart everything:**
   - Stop Hardhat node (Ctrl+C)
   - Stop dev server (Ctrl+C)
   - Restart Hardhat: `npm run chain`
   - Restart dev server: `npm run dev`
   - Refresh browser

2. **Clear browser data:**
   - Clear localStorage
   - Clear cache
   - Hard refresh (Ctrl+Shift+R)

3. **Check all requirements:**
   - ✅ Hardhat node running
   - ✅ MetaMask connected
   - ✅ On Hardhat Local network
   - ✅ Have ETH balance
   - ✅ Contract deployed
   - ✅ EPIC number verified

## Getting Help

If you're still stuck, check the browser console for detailed error messages and share them for debugging.

