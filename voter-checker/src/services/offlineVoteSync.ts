/**
 * Offline Vote Sync Service
 * Handles synchronization of queued votes when connection is restored
 */

import { offlineVoteStorage, QueuedVote } from './offlineVoteStorage'
import { castVote, checkEpicVotedStatus } from './votingService'

export interface SyncStatus {
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: number | null
  lastError: string | null
}

class OfflineVoteSync {
  private isSyncing = false
  private syncListeners: Set<(status: SyncStatus) => void> = new Set()

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    if (typeof window === 'undefined') return true
    return navigator.onLine
  }

  /**
   * Subscribe to sync status updates
   */
  onSyncStatusUpdate(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback)
    return () => {
      this.syncListeners.delete(callback)
    }
  }

  /**
   * Notify listeners of sync status change
   */
  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in sync status listener:', error)
      }
    })
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingCount = await offlineVoteStorage.getPendingCount()
    return {
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncTime: this.getLastSyncTime(),
      lastError: this.getLastError(),
    }
  }

  /**
   * Get last sync time from localStorage
   */
  private getLastSyncTime(): number | null {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('lastVoteSyncTime')
    return stored ? parseInt(stored, 10) : null
  }

  /**
   * Set last sync time
   */
  private setLastSyncTime(timestamp: number) {
    if (typeof window === 'undefined') return
    localStorage.setItem('lastVoteSyncTime', timestamp.toString())
  }

  /**
   * Get last error from localStorage
   */
  private getLastError(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lastVoteSyncError')
  }

  /**
   * Set last error
   */
  private setLastError(error: string | null) {
    if (typeof window === 'undefined') return
    if (error) {
      localStorage.setItem('lastVoteSyncError', error)
    } else {
      localStorage.removeItem('lastVoteSyncError')
    }
  }

  /**
   * Sync all pending votes
   */
  async syncPendingVotes(): Promise<{ success: number; failed: number; errors: string[] }> {
    if (this.isSyncing) {
      console.log('Sync already in progress')
      return { success: 0, failed: 0, errors: [] }
    }

    if (!this.isOnline()) {
      console.log('Device is offline, cannot sync')
      return { success: 0, failed: 0, errors: ['Device is offline'] }
    }

    // Check if MetaMask is available
    if (typeof window === 'undefined' || !window.ethereum) {
      const error = 'MetaMask not found. Please connect your wallet to sync votes.'
      this.setLastError(error)
      return { success: 0, failed: 0, errors: [error] }
    }

    this.isSyncing = true
    this.notifyListeners(await this.getSyncStatus())

    try {
      const pendingVotes = await offlineVoteStorage.getPendingVotes()
      console.log(`Syncing ${pendingVotes.length} pending votes...`)

      if (pendingVotes.length === 0) {
        this.isSyncing = false
        this.setLastError(null)
        this.setLastSyncTime(Date.now())
        this.notifyListeners(await this.getSyncStatus())
        return { success: 0, failed: 0, errors: [] }
      }

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      // Sort by timestamp to process in order
      pendingVotes.sort((a, b) => a.timestamp - b.timestamp)

      for (const vote of pendingVotes) {
        try {
          // Check if EPIC has already voted (prevent duplicates)
          const hasVoted = await checkEpicVotedStatus(vote.epicNumber)
          if (hasVoted) {
            console.log(`EPIC ${vote.epicNumber} already voted, removing from queue`)
            await offlineVoteStorage.updateVoteStatus(vote.id, 'synced')
            await offlineVoteStorage.removeVote(vote.id)
            successCount++
            continue
          }

          // Update status to syncing
          await offlineVoteStorage.updateVoteStatus(vote.id, 'syncing')

          // Attempt to cast vote
          const { txHash } = await castVote({
            epicNumber: vote.epicNumber,
            candidateId: vote.candidateId,
            wardId: vote.wardId,
          })

          console.log(`Vote synced successfully: ${txHash}`)

          // Mark as synced and remove from queue
          await offlineVoteStorage.updateVoteStatus(vote.id, 'synced')
          await offlineVoteStorage.removeVote(vote.id)
          successCount++

          // Small delay between votes to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error: any) {
          console.error(`Failed to sync vote ${vote.id}:`, error)

          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          errors.push(`Vote ${vote.id}: ${errorMessage}`)

          // Check if it's a permanent error (already voted, invalid params, etc.)
          const isPermanentError =
            errorMessage.includes('already voted') ||
            errorMessage.includes('Invalid') ||
            errorMessage.includes('not found')

          if (isPermanentError || (vote.retryCount || 0) >= 3) {
            // Mark as failed after max retries
            await offlineVoteStorage.updateVoteStatus(vote.id, 'failed', errorMessage)
            failedCount++
          } else {
            // Reset to pending for retry
            await offlineVoteStorage.updateVoteStatus(vote.id, 'pending', errorMessage)
            failedCount++
          }
        }
      }

      this.setLastSyncTime(Date.now())
      this.setLastError(errors.length > 0 ? errors.join('; ') : null)

      console.log(`Sync complete: ${successCount} succeeded, ${failedCount} failed`)

      return { success: successCount, failed: failedCount, errors }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown sync error'
      console.error('Sync error:', errorMessage)
      this.setLastError(errorMessage)
      return { success: 0, failed: 0, errors: [errorMessage] }
    } finally {
      this.isSyncing = false
      this.notifyListeners(await this.getSyncStatus())
    }
  }

  /**
   * Auto-sync when connection is restored
   */
  setupAutoSync() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      console.log('Connection restored, auto-syncing votes...')
      // Small delay to ensure network is fully restored
      setTimeout(() => {
        this.syncPendingVotes().catch((error) => {
          console.error('Auto-sync failed:', error)
        })
      }, 2000)
    })

    // Also sync on page visibility change (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline()) {
        const pendingCount = offlineVoteStorage.getPendingCount()
        pendingCount.then((count) => {
          if (count > 0) {
            console.log('Page visible and online, checking for pending votes...')
            this.syncPendingVotes().catch((error) => {
              console.error('Auto-sync on visibility change failed:', error)
            })
          }
        })
      }
    })
  }
}

// Export singleton instance
export const offlineVoteSync = new OfflineVoteSync()

