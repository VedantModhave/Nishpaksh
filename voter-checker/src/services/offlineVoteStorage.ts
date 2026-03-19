/**
 * IndexedDB service for storing offline votes
 * Provides persistent storage for votes queued when offline
 */

export interface QueuedVote {
  id: string // Unique ID for the queued vote
  epicNumber: string
  candidateId: string | number | bigint
  wardId: string | number | bigint
  timestamp: number // When the vote was queued
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
  lastError?: string
  candidateName?: string // Optional: for display purposes
}

const DB_NAME = 'NishpakshVotingDB'
const STORE_NAME = 'queuedVotes'
const DB_VERSION = 2 // Updated to match apiCacheStorage version

class OfflineVoteStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * Initialize IndexedDB database
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('status', 'status', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Add a vote to the queue
   */
  async queueVote(vote: Omit<QueuedVote, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    await this.init()

    const queuedVote: QueuedVote = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      ...vote,
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(queuedVote)

      request.onsuccess = () => {
        resolve(queuedVote.id)
      }

      request.onerror = () => {
        reject(new Error('Failed to queue vote'))
      }
    })
  }

  /**
   * Get all pending votes
   */
  async getPendingVotes(): Promise<QueuedVote[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([])
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(new Error('Failed to get pending votes'))
      }
    })
  }

  /**
   * Get all votes (for debugging/admin purposes)
   */
  async getAllVotes(): Promise<QueuedVote[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([])
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(new Error('Failed to get all votes'))
      }
    })
  }

  /**
   * Update vote status
   */
  async updateVoteStatus(
    id: string,
    status: QueuedVote['status'],
    error?: string
  ): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const vote = getRequest.result
        if (!vote) {
          reject(new Error('Vote not found'))
          return
        }

        vote.status = status
        if (error) {
          vote.lastError = error
        }
        if (status === 'syncing') {
          vote.retryCount = (vote.retryCount || 0) + 1
        }

        const updateRequest = store.put(vote)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(new Error('Failed to update vote'))
      }

      getRequest.onerror = () => {
        reject(new Error('Failed to get vote'))
      }
    })
  }

  /**
   * Remove a vote from the queue (after successful sync)
   */
  async removeVote(id: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to remove vote'))
      }
    })
  }

  /**
   * Clear all synced votes (cleanup old data)
   */
  async clearSyncedVotes(): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')
      const request = index.getAll('synced')

      request.onsuccess = () => {
        const syncedVotes = request.result || []
        const deletePromises = syncedVotes.map((vote: QueuedVote) => {
          return new Promise<void>((resolveDelete, rejectDelete) => {
            const deleteRequest = store.delete(vote.id)
            deleteRequest.onsuccess = () => resolveDelete()
            deleteRequest.onerror = () => rejectDelete()
          })
        })

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(() => reject(new Error('Failed to clear synced votes')))
      }

      request.onerror = () => {
        reject(new Error('Failed to get synced votes'))
      }
    })
  }

  /**
   * Get count of pending votes
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingVotes()
    return pending.length
  }
}

// Export singleton instance
export const offlineVoteStorage = new OfflineVoteStorage()

