# Party Symbols Setup Guide

## ✅ What Has Been Done

1. **Created folder structure**: 
   - `public/party-symbols/` directory has been created for storing party symbol images

2. **Updated Dashboard Code**:
   - Modified `src/app/dashboard/page.tsx` to support displaying party symbol images
   - Added `getSymbolImagePath()` function that maps symbol names to image files
   - Updated `CandidateCard` component to display images with fallback to emojis
   - Updated vote confirmation modal to show symbol images

3. **Image Support**:
   - Uses Next.js `Image` component for optimized image loading
   - Automatic fallback to emoji icons if image files don't exist
   - Error handling for missing or broken images

## 📁 Where to Upload Your Images

**Location**: `voter-checker/public/party-symbols/`

Upload your party symbol image files directly to this folder.

## 📝 File Naming Requirements

Your image files should be named exactly as follows (case-sensitive):

| Symbol Name | File Name |
|------------|-----------|
| Lotus | `lotus.png` |
| Hand | `hand.png` |
| Book | `book.png` |
| Torch / Flaming Torch | `torch.png` |
| Clock | `clock.png` |
| Cycle / Bicycle | `cycle.png` |
| Lantern | `lantern.png` |

## 🖼️ Image Specifications

- **Format**: PNG (recommended), JPG, or SVG
- **Size**: 64x64px to 128x128px (will be auto-scaled)
- **Background**: Transparent background preferred
- **Aspect Ratio**: Square (1:1) recommended

## 🚀 How to Use

1. **Upload your images**:
   - Copy your party symbol image files to `voter-checker/public/party-symbols/`
   - Make sure the filenames match exactly (e.g., `lotus.png`, `hand.png`)

2. **Test the dashboard**:
   - Run `npm run dev` in the `voter-checker` directory
   - Navigate to the dashboard page
   - The party symbols should now display as images instead of emojis

3. **If images don't appear**:
   - Check that filenames match exactly (case-sensitive)
   - Verify images are in `public/party-symbols/` folder
   - Check browser console for any errors
   - The system will automatically fallback to emoji icons if images are missing

## 🔧 Adding New Symbols

If you need to add support for additional party symbols:

1. Upload the image file to `public/party-symbols/` with an appropriate name
2. Edit `src/app/dashboard/page.tsx`
3. Find the `getSymbolImagePath` function (around line 228)
4. Add your new symbol mapping to the `symbolMap` object:

```typescript
const symbolMap: { [key: string]: string } = {
    'lotus': 'lotus.png',
    'hand': 'hand.png',
    // Add your new symbol:
    'your-symbol-name': 'your-image-file.png',
}
```

## 📍 Current Symbols in Use

Based on your `candidates.json`, these symbols are currently active:
- **Lotus** - Bharatiya Janata Party
- **Hand** - Indian National Congress  
- **Book** - Independent candidates
- **Flaming Torch** - Shiv Sena (Uddhav Balasaheb Thackeray)

## ✨ Features

- ✅ Automatic image loading with Next.js Image optimization
- ✅ Fallback to emoji icons if images are missing
- ✅ Error handling for broken images
- ✅ Displays in both candidate cards and vote confirmation modal
- ✅ Responsive design maintained

## 🐛 Troubleshooting

**Images not showing?**
- Verify files are in `voter-checker/public/party-symbols/` (not root `public/`)
- Check filename spelling and case (must match exactly)
- Ensure file extensions are correct (.png, .jpg, etc.)
- Clear browser cache and restart dev server

**Still seeing emojis?**
- This is normal if image files don't exist - emojis are the fallback
- Upload the image files to see them replace emojis

**Build errors?**
- Make sure all image files are committed to your repository
- Check that Next.js can access the public folder

