/**
 * API Cache Storage Service
 * Extends the existing IndexedDB database to cache API responses
 * Provides offline access to previously fetched data
 */

export interface CachedResponse {
  key: string // Cache key (usually URL + params)
  data: any // Cached response data
  timestamp: number // When it was cached
  expiresAt: number // When it expires (timestamp)
  url: string // Original URL for reference
}

const DB_NAME = 'NishpakshVotingDB' // Same database as offlineVoteStorage
const STORE_NAME = 'apiCache'
const DB_VERSION = 2 // Increment version to add new store

// Default cache TTL (Time To Live) in milliseconds
const DEFAULT_TTL = {
  candidates: 24 * 60 * 60 * 1000, // 24 hours - candidates don't change often
  wardData: 7 * 24 * 60 * 60 * 1000, // 7 days - ward data is static
  voterData: 0, // No cache - voter data is user-specific and should be fresh
  results: 5 * 60 * 1000, // 5 minutes - results change frequently
}

class ApiCacheStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * Initialize IndexedDB database (extends existing DB)
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

        // Create apiCache store if it doesn't exist (preserve existing queuedVotes store)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
          store.createIndex('url', 'url', { unique: false })
        }
        
        // Ensure queuedVotes store exists (for backward compatibility)
        if (!db.objectStoreNames.contains('queuedVotes')) {
          const voteStore = db.createObjectStore('queuedVotes', { keyPath: 'id' })
          voteStore.createIndex('timestamp', 'timestamp', { unique: false })
          voteStore.createIndex('status', 'status', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Generate cache key from URL and options
   */
  private generateCacheKey(url: string, options?: RequestInit): string {
    // Include method, headers, and body in key for POST requests
    if (options?.method === 'POST' && options.body) {
      const bodyStr = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body)
      return `${url}:${options.method}:${bodyStr}`
    }
    return url
  }

  /**
   * Get TTL for a specific cache type
   */
  private getTTL(url: string): number {
    if (url.includes('candidates') || url.includes('bmc_candidates')) {
      return DEFAULT_TTL.candidates
    }
    if (url.includes('ward-data') || url.includes('ward')) {
      return DEFAULT_TTL.wardData
    }
    if (url.includes('results') || url.includes('VoteCasted')) {
      return DEFAULT_TTL.results
    }
    if (url.includes('voter') || url.includes('search-voter')) {
      return DEFAULT_TTL.voterData
    }
    // Default TTL: 1 hour
    return 60 * 60 * 1000
  }

  /**
   * Store API response in cache
   */
  async setCache(url: string, data: any, options?: RequestInit, customTTL?: number): Promise<void> {
    await this.init()

    const key = this.generateCacheKey(url, options)
    const timestamp = Date.now()
    const ttl = customTTL ?? this.getTTL(url)
    const expiresAt = timestamp + ttl

    // Skip caching if TTL is 0 (voter data, etc.)
    if (ttl === 0) {
      return
    }

    const cachedResponse: CachedResponse = {
      key,
      data,
      timestamp,
      expiresAt,
      url,
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(cachedResponse)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to cache response'))
      }
    })
  }

  /**
   * Get cached response if available and not expired
   */
  async getCache(url: string, options?: RequestInit): Promise<any | null> {
    await this.init()

    const key = this.generateCacheKey(url, options)

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null)
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const cached = request.result as CachedResponse | undefined

        if (!cached) {
          resolve(null)
          return
        }

        // Check if expired
        if (Date.now() > cached.expiresAt) {
          // Remove expired cache
          this.removeCache(key).catch(console.error)
          resolve(null)
          return
        }

        resolve(cached.data)
      }

      request.onerror = () => {
        reject(new Error('Failed to get cache'))
      }
    })
  }

  /**
   * Remove specific cache entry
   */
  async removeCache(key: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to remove cache'))
      }
    })
  }

  /**
   * Clear all expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(0)
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('expiresAt')
      const now = Date.now()
      const range = IDBKeyRange.upperBound(now)
      const request = index.openCursor(range)

      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => {
        reject(new Error('Failed to clear expired cache'))
      }
    })
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAllCache(): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to clear cache'))
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ total: number; expired: number; valid: number }> {
    await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve({ total: 0, expired: 0, valid: 0 })
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const all = request.result as CachedResponse[] || []
        const now = Date.now()
        const expired = all.filter((c) => now > c.expiresAt).length
        const valid = all.length - expired

        resolve({
          total: all.length,
          expired,
          valid,
        })
      }

      request.onerror = () => {
        reject(new Error('Failed to get cache stats'))
      }
    })
  }
}

// Export singleton instance
export const apiCacheStorage = new ApiCacheStorage()

// Auto-cleanup expired cache on initialization (runs once)
if (typeof window !== 'undefined') {
  apiCacheStorage.clearExpiredCache().catch(console.error)
}

