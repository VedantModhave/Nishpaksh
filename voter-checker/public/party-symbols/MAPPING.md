# Party Symbol Mapping Reference

This document shows how party names and symbols are mapped to logo files.

## Party Name Mappings (Primary - Most Reliable)

| Party Name | Logo File |
|------------|-----------|
| Bharatiya Janata Party / BJP | `bjp-logo.webp` |
| Indian National Congress / Congress | `congress-logo.webp` |
| Shiv Sena (Uddhav Balasaheb Thackeray) | `shivsena-ubt-logo.webp` |
| Shiv Sena | `shivsena-logo.webp` |
| Nationalist Congress Party / NCP | `ncp-logo.webp` |
| Maharashtra Navnirman Sena / MNS | `mns-logo.webp` |
| Bahujan Samaj Party / Bahujan | `bahujan-party.webp` |
| Samajwadi Party / Samajwadi | `samaajvadi-logo.webp` |
| Janata Dal (Secular) / JDS | `jds-logo-badge.png` |
| Independent (Male) | `generic.webp` |
| Independent (Female) | `generic-female.webp` |

## Symbol Mappings (Fallback)

| Symbol | Logo File |
|--------|-----------|
| Lotus | `bjp-logo.webp` |
| Hand | `congress-logo.webp` |
| Flaming Torch / Torch | `shivsena-ubt-logo.webp` |
| Book (Male) | `generic.webp` |
| Book (Female) | `generic-female.webp` |

## Mapping Logic

1. **Primary**: Party name is checked first (most reliable)
2. **Fallback**: If party name doesn't match, symbol is checked
3. **Gender-aware**: Independent candidates use `generic-female.webp` if `is_women_reserved` is true, otherwise `generic.webp`

## Current Candidates in System

Based on `candidates.json`:
- **Bharatiya Janata Party** (Lotus) → `bjp-logo.webp` ✅
- **Indian National Congress** (Hand) → `congress-logo.webp` ✅
- **Independent** (Book) → `generic-female.webp` (if women reserved) or `generic.webp` ✅
- **Shiv Sena (Uddhav Balasaheb Thackeray)** (Flaming Torch) → `shivsena-ubt-logo.webp` ✅

## Adding New Mappings

To add support for new parties, edit `src/app/dashboard/page.tsx` and update the `getSymbolImagePath` function:

```typescript
const partyMap: { [key: string]: string } = {
    // ... existing mappings
    'your party name': 'your-logo-file.webp',
}
```

