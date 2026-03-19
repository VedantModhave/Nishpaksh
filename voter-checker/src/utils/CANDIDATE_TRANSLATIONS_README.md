# Candidate Name Translations Guide

This file explains how to add multilingual translations for candidate names.

## How It Works

The `candidateTranslations.ts` file contains a mapping of candidate names/IDs to their translations in English, Hindi, and Marathi.

## Adding Candidate Translations

To add translations for a candidate, edit `voter-checker/src/utils/candidateTranslations.ts` and add an entry in the `candidateNameTranslations` object:

```typescript
"Candidate Name": {
  en: "English Name",
  hi: "हिंदी नाम",
  mr: "मराठी नाम"
}
```

### Example

```typescript
"John Doe": {
  en: "John Doe",
  hi: "जॉन डो",
  mr: "जॉन डो"
}
```

## Matching Candidates

The system tries to match candidates in this order:
1. By candidate ID (if provided)
2. By exact candidate name match
3. By case-insensitive name match

If no translation is found, the original name is displayed.

## Tips

1. **Use Candidate IDs**: If your API provides unique candidate IDs, use those as keys for more reliable matching:
   ```typescript
   "candidate_12345": {
     en: "John Doe",
     hi: "जॉन डो",
     mr: "जॉन डो"
   }
   ```

2. **Transliteration**: For proper transliteration of names, you may want to:
   - Use a transliteration library
   - Manually add accurate translations
   - Use online transliteration tools for Hindi/Marathi

3. **Bulk Import**: If you have many candidates, you can:
   - Export candidate data from your database
   - Use a script to generate translation entries
   - Import them into this file

## Current Implementation

The translation system is already integrated into:
- Dashboard candidate cards
- Vote confirmation modal
- Anywhere candidate names are displayed

The system automatically uses the current language setting to display the appropriate translation.

