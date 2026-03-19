/**
 * Fetch wrapper with automatic caching
 * Checks cache first, falls back to network, then updates cache
 */

import { apiCacheStorage } from '@/services/apiCacheStorage'

export interface FetchWithCacheOptions extends RequestInit {
  cacheTTL?: number // Custom TTL in milliseconds
  forceRefresh?: boolean // Skip cache and force network fetch
  cacheKey?: string // Custom cache key (optional)
}

/**
 * Fetch with automatic caching
 * 
 * Strategy:
 * 1. Check cache first (if online or offline)
 * 2. If cache miss or expired, fetch from network
 * 3. Update cache with fresh data
 * 4. Return data
 * 
 * @param url - URL to fetch
 * @param options - Fetch options + cache options
 * @returns Response data
 */
export async function fetchWithCache<T = any>(
  url: string,
  options: FetchWithCacheOptions = {}
): Promise<T> {
  const {
    cacheTTL,
    forceRefresh = false,
    cacheKey,
    ...fetchOptions
  } = options

  // Try to get from cache first (unless force refresh)
  if (!forceRefresh) {
    try {
      const cached = await apiCacheStorage.getCache(url, fetchOptions)
      if (cached !== null) {
        console.log(`[Cache HIT] ${url}`)
        return cached as T
      }
      console.log(`[Cache MISS] ${url}`)
    } catch (error) {
      console.warn('Cache read error:', error)
      // Continue to network fetch
    }
  }

  // Check if offline
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine

  if (!isOnline && !forceRefresh) {
    // Try cache one more time (might have expired check)
    try {
      const cached = await apiCacheStorage.getCache(url, fetchOptions)
      if (cached !== null) {
        console.log(`[Cache HIT - Offline] ${url}`)
        return cached as T
      }
    } catch (error) {
      console.warn('Cache read error (offline):', error)
    }

    // No cache available and offline
    throw new Error(`Network request failed: ${url}. Device is offline and no cached data available.`)
  }

  // Fetch from network
  try {
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse response (assume JSON for now)
    const data = await response.json()

    // Store in cache (async, don't wait)
    apiCacheStorage
      .setCache(url, data, fetchOptions, cacheTTL)
      .then(() => {
        console.log(`[Cache STORED] ${url}`)
      })
      .catch((error) => {
        console.warn('Cache write error:', error)
      })

    return data as T
  } catch (error: any) {
    // If network fails, try cache one last time
    if (!forceRefresh) {
      try {
        const cached = await apiCacheStorage.getCache(url, fetchOptions)
        if (cached !== null) {
          console.log(`[Cache FALLBACK] ${url}`)
          return cached as T
        }
      } catch (cacheError) {
        console.warn('Cache fallback error:', cacheError)
      }
    }

    // Re-throw original error
    throw error
  }
}

/**
 * Clear cache for a specific URL
 */
export async function clearCacheForUrl(url: string, options?: RequestInit): Promise<void> {
  const key = options?.method === 'POST' && options.body
    ? `${url}:${options.method}:${typeof options.body === 'string' ? options.body : JSON.stringify(options.body)}`
    : url
  return apiCacheStorage.removeCache(key)
}

/**
 * Clear all API cache
 */
export async function clearAllCache(): Promise<void> {
  return apiCacheStorage.clearAllCache()
}

