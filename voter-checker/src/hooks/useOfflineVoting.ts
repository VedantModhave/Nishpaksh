/**
 * React hook for offline voting functionality
 * Provides network status, pending votes count, and sync functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { offlineVoteSync, SyncStatus } from '@/services/offlineVoteSync'
import { offlineVoteStorage } from '@/services/offlineVoteStorage'

export function useOfflineVoting() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  })

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Set initial status
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Subscribe to sync status updates
  useEffect(() => {
    // Get initial status
    offlineVoteSync.getSyncStatus().then(setSyncStatus)

    // Subscribe to updates
    const unsubscribe = offlineVoteSync.onSyncStatusUpdate(setSyncStatus)

    // Refresh status periodically
    const interval = setInterval(() => {
      offlineVoteSync.getSyncStatus().then(setSyncStatus)
    }, 5000) // Check every 5 seconds

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // Manual sync function
  const syncVotes = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline')
    }
    return await offlineVoteSync.syncPendingVotes()
  }, [isOnline])

  // Setup auto-sync (should be called once in app)
  useEffect(() => {
    offlineVoteSync.setupAutoSync()
  }, [])

  return {
    isOnline,
    syncStatus,
    pendingCount: syncStatus.pendingCount,
    isSyncing: syncStatus.isSyncing,
    syncVotes,
    hasPendingVotes: syncStatus.pendingCount > 0,
  }
}

