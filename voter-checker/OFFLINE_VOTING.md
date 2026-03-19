# Offline Vote Caching Feature

## Overview

The offline vote caching feature allows users to cast votes even when they have no internet connection. Votes are stored locally and automatically synchronized to the blockchain when the connection is restored.

## How It Works

### 1. **Offline Detection**
- The system automatically detects when the device goes offline using the `navigator.onLine` API
- Network status is monitored in real-time using browser event listeners

### 2. **Vote Queueing**
- When offline, votes are stored in **IndexedDB** (a persistent browser database)
- Each queued vote includes:
  - EPIC number
  - Candidate ID
  - Ward ID
  - Timestamp
  - Status (pending, syncing, synced, failed)
  - Retry count

### 3. **Automatic Synchronization**
- When connection is restored, the system automatically syncs all pending votes
- Sync happens in chronological order (oldest first)
- Before syncing each vote, the system checks if the EPIC has already voted (prevents duplicates)

### 4. **Manual Sync**
- Users can manually trigger sync by clicking the "Sync" button in the dashboard header
- Sync button appears when there are pending votes and the device is online

## Architecture

### Services

#### `offlineVoteStorage.ts`
- **IndexedDB wrapper** for storing queued votes
- Provides methods to:
  - Queue votes
  - Get pending votes
  - Update vote status
  - Remove synced votes
  - Get pending count

#### `offlineVoteSync.ts`
- **Synchronization service** that processes queued votes
- Features:
  - Auto-sync on connection restore
  - Duplicate prevention (checks `hasVotedByEpic()`)
  - Retry logic (max 3 retries)
  - Error handling and status tracking

#### `votingService.ts` (Modified)
- **Enhanced `castVote()` function** that:
  - Detects offline status
  - Queues votes when offline
  - Returns special response for queued votes
  - Supports `forceOnline` flag to require online connection

### React Hook

#### `useOfflineVoting.ts`
- Provides:
  - `isOnline` - Current network status
  - `pendingCount` - Number of queued votes
  - `isSyncing` - Whether sync is in progress
  - `syncVotes()` - Manual sync function
  - `hasPendingVotes` - Boolean flag

## User Experience

### Offline Voting Flow

1. **User casts vote while offline**
   - Vote is queued in IndexedDB
   - Success message shows "Vote queued for offline sync"
   - No transaction hash (vote not yet on blockchain)

2. **Connection Restored**
   - System automatically detects online status
   - Auto-sync begins after 2-second delay
   - Pending votes are processed one by one

3. **During Sync**
   - Header shows "Syncing..." indicator
   - Each vote is checked for duplicates
   - Successful votes are removed from queue
   - Failed votes are marked and can be retried

### UI Indicators

#### Dashboard Header
- **Offline Badge**: Yellow indicator when device is offline
- **Pending Votes Badge**: Blue indicator showing count of queued votes (when online)
- **Queued Votes Badge**: Gray indicator showing count (when offline)
- **Sync Button**: Appears when there are pending votes and device is online

#### Vote Confirmation Modal
- Shows warning when offline: "You are currently offline"
- Explains that vote will be saved locally
- Success message differs for queued votes vs. confirmed transactions

## Technical Details

### Storage
- **IndexedDB Database**: `NishpakshVotingDB`
- **Object Store**: `queuedVotes`
- **Indexes**: `timestamp`, `status`
- **Persistence**: Data persists across browser sessions

### Sync Process
1. Get all pending votes (sorted by timestamp)
2. For each vote:
   - Check if EPIC already voted → Remove from queue if yes
   - Update status to "syncing"
   - Call `castVote()` with `forceOnline: true`
   - On success: Mark as "synced" and remove
   - On failure: Increment retry count or mark as "failed"
3. Update sync status and notify listeners

### Error Handling
- **Network Errors**: Votes remain in queue for retry
- **Already Voted**: Vote removed from queue (no error)
- **Invalid Parameters**: Vote marked as failed (permanent error)
- **Max Retries**: After 3 retries, vote is marked as failed

### Duplicate Prevention
- Before syncing, system checks `hasVotedByEpic(epicNumber)`
- If already voted, vote is removed from queue (not an error)
- Prevents double-voting when user votes offline and online

## Usage Example

```typescript
import { useOfflineVoting } from '@/hooks/useOfflineVoting'

function MyComponent() {
  const { isOnline, pendingCount, syncVotes, hasPendingVotes } = useOfflineVoting()

  return (
    <div>
      {!isOnline && <div>You are offline</div>}
      {hasPendingVotes && (
        <button onClick={syncVotes}>
          Sync {pendingCount} pending votes
        </button>
      )}
    </div>
  )
}
```

## Testing

### Test Offline Mode
1. Open browser DevTools → Network tab
2. Set to "Offline" mode
3. Cast a vote
4. Verify vote is queued (check IndexedDB in Application tab)
5. Set network back to "Online"
6. Verify auto-sync occurs

### Test Manual Sync
1. Queue votes while offline
2. Go online
3. Click "Sync" button in header
4. Verify votes are processed

### Test Duplicate Prevention
1. Vote offline
2. Vote again online (same EPIC)
3. Go online and sync
4. Verify first vote syncs, second is rejected

## Limitations

1. **MetaMask Required**: Sync requires MetaMask to be connected
2. **Gas Fees**: Each synced vote requires gas (user must have ETH)
3. **Browser Storage**: Limited by browser's IndexedDB quota
4. **Single Device**: Votes are stored per browser/device
5. **No Cross-Device Sync**: Votes queued on one device won't appear on another

## Future Enhancements

- [ ] Background sync using Service Workers
- [ ] Cross-device sync via cloud storage
- [ ] Batch transaction optimization
- [ ] Offline vote encryption
- [ ] Sync progress percentage
- [ ] Vote history view
- [ ] Export queued votes for backup

## Files Modified/Created

### New Files
- `src/services/offlineVoteStorage.ts` - IndexedDB storage service
- `src/services/offlineVoteSync.ts` - Sync service
- `src/hooks/useOfflineVoting.ts` - React hook

### Modified Files
- `src/services/votingService.ts` - Added offline detection and queueing
- `src/app/dashboard/page.tsx` - Added offline UI indicators and sync functionality

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 10+)
- **Opera**: ✅ Full support

All modern browsers support IndexedDB and the `navigator.onLine` API.

