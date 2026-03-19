# API Response Caching Feature

## Overview

The API caching feature extends the offline vote caching system to cache API responses in IndexedDB, allowing the application to work partially offline with previously fetched data.

## How It Works

### 1. **Cache-First Strategy**
- When making API calls, the system checks IndexedDB cache first
- If cache exists and is valid (not expired), returns cached data immediately
- If cache miss or expired, fetches from network and updates cache
- Falls back to cache if network request fails (offline mode)

### 2. **Automatic Cache Management**
- **TTL (Time To Live)**: Each cached response has an expiration time
- **Auto-cleanup**: Expired cache entries are automatically removed
- **Smart TTL**: Different cache durations for different data types

### 3. **Cache Types & TTL**

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Candidates | 24 hours | Candidates don't change frequently |
| Ward Data | 7 days | Geographic data is static |
| Results | 5 minutes | Results change as votes come in |
| Voter Data | No cache | User-specific, should be fresh |

## Architecture

### Services

#### `apiCacheStorage.ts`
- **IndexedDB wrapper** for caching API responses
- Extends existing `NishpakshVotingDB` database
- Provides methods to:
  - Store cached responses
  - Retrieve cached responses
  - Check expiration
  - Clear expired cache
  - Get cache statistics

#### `fetchWithCache.ts`
- **Fetch wrapper utility** with automatic caching
- Drop-in replacement for `fetch()`
- Handles:
  - Cache checking
  - Network fetching
  - Cache updating
  - Offline fallback

### Database Structure

```
NishpakshVotingDB (v2)
├── queuedVotes (existing)
│   └── Stores offline votes
└── apiCache (new)
    └── Stores API responses
        ├── key: Cache key (URL + params)
        ├── data: Response data
        ├── timestamp: When cached
        ├── expiresAt: Expiration time
        └── url: Original URL
```

## Usage

### Basic Usage

```typescript
import { fetchWithCache } from '@/utils/fetchWithCache'

// Simple GET request with automatic caching
const data = await fetchWithCache('/api/ward-data')

// With custom TTL
const candidates = await fetchWithCache(url, {
  headers: { ... },
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
})

// Force refresh (skip cache)
const freshData = await fetchWithCache(url, {
  forceRefresh: true,
})
```

### Current Implementation

#### Dashboard (`dashboard/page.tsx`)
- **Ward Data**: Cached for 7 days
- **Candidates**: Cached for 24 hours
- Works offline if data was previously fetched

#### Results Page (`resultsService.ts`)
- **Candidates List**: Cached for 5 minutes
- Allows viewing results offline with cached candidate data

## Cache Flow

```
┌─────────────────┐
│  API Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Cache     │
│ (IndexedDB)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│ HIT  │  │   MISS    │
└──┬───┘  └─────┬──────┘
   │            │
   │            ▼
   │      ┌──────────┐
   │      │  Fetch   │
   │      │ Network  │
   │      └─────┬────┘
   │            │
   │            ▼
   │      ┌──────────┐
   │      │  Update  │
   │      │  Cache   │
   │      └─────┬────┘
   │            │
   └────────────┘
         │
         ▼
┌─────────────────┐
│  Return Data    │
└─────────────────┘
```

## Offline Behavior

### When Online
1. Check cache → If valid, return immediately
2. If cache miss/expired → Fetch from network
3. Update cache with fresh data
4. Return fresh data

### When Offline
1. Check cache → If valid, return cached data
2. If cache miss → Throw error (no network, no cache)
3. User sees cached data or appropriate error message

## Cache Management

### Automatic Cleanup
- Expired cache entries are automatically removed on:
  - Database initialization
  - Cache retrieval (lazy cleanup)

### Manual Cache Control

```typescript
import { clearCacheForUrl, clearAllCache } from '@/utils/fetchWithCache'
import { apiCacheStorage } from '@/services/apiCacheStorage'

// Clear cache for specific URL
await clearCacheForUrl('/api/ward-data')

// Clear all cache
await clearAllCache()

// Get cache statistics
const stats = await apiCacheStorage.getCacheStats()
console.log(`Total: ${stats.total}, Valid: ${stats.valid}, Expired: ${stats.expired}`)
```

## Benefits

### 1. **Offline Support**
- Users can view previously loaded data offline
- Dashboard works with cached candidates and ward data
- Results page shows cached candidate information

### 2. **Performance**
- Faster page loads (cache is instant)
- Reduced API calls
- Lower bandwidth usage

### 3. **User Experience**
- Seamless offline/online transitions
- No broken pages when offline
- Graceful degradation

## Limitations

### 1. **Initial Load**
- First visit requires internet connection
- Cache is built on first successful fetch

### 2. **Stale Data**
- Offline users see cached data (may be outdated)
- Results page shows 5-minute-old data at most
- Candidates list shows 24-hour-old data at most

### 3. **User-Specific Data**
- Voter data is NOT cached (TTL = 0)
- Each voter search requires fresh API call
- This is intentional for security/privacy

### 4. **Storage Limits**
- IndexedDB has browser-specific limits
- Large responses consume storage
- Auto-cleanup prevents unlimited growth

## Testing

### Test Online → Offline Flow

1. **Load dashboard while online**
   - Verify candidates load
   - Verify ward data loads
   - Check IndexedDB in DevTools → Application tab

2. **Go offline** (DevTools → Network → Offline)
   - Refresh dashboard
   - Verify candidates still show (from cache)
   - Verify ward data still works (from cache)

3. **Go online again**
   - Verify fresh data is fetched
   - Verify cache is updated

### Test Cache Expiration

1. **Manually expire cache** (DevTools → Application → IndexedDB)
2. **Go offline**
3. **Try to load dashboard**
4. **Verify appropriate error handling**

## Files Modified/Created

### New Files
- `src/services/apiCacheStorage.ts` - IndexedDB cache storage
- `src/utils/fetchWithCache.ts` - Fetch wrapper with caching

### Modified Files
- `src/services/offlineVoteStorage.ts` - Updated DB version to 2
- `src/app/dashboard/page.tsx` - Uses `fetchWithCache` for candidates and ward data
- `src/services/resultsService.ts` - Uses `fetchWithCache` for candidate list

## Future Enhancements

- [ ] Cache invalidation on data updates
- [ ] Cache size limits and LRU eviction
- [ ] Cache compression for large responses
- [ ] Cache analytics and monitoring
- [ ] Background cache refresh
- [ ] Cache versioning for API changes

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 10+)
- **Opera**: ✅ Full support

All modern browsers support IndexedDB and the caching APIs.

