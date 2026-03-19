# Party Symbols Directory

Upload party symbol images to this directory. The dashboard will automatically display these images for the corresponding party symbols.

## File Naming Convention

Upload your party symbol images with the following exact filenames (case-sensitive):

- `lotus.png` - For "Lotus" symbol (BJP)
- `hand.png` - For "Hand" symbol (Congress)
- `book.png` - For "Book" symbol
- `torch.png` - For "Torch" or "Flaming Torch" symbol
- `clock.png` - For "Clock" symbol
- `cycle.png` - For "Cycle" or "Bicycle" symbol
- `lantern.png` - For "Lantern" symbol

## Image Requirements

- **Format**: PNG, JPG, or SVG (PNG recommended for transparency)
- **Size**: Recommended 64x64px to 128x128px (will be scaled automatically)
- **Background**: Transparent background preferred
- **Aspect Ratio**: Square (1:1) recommended

## How It Works

1. The dashboard maps symbol names from the candidate data to these image files
2. If an image file exists, it will be displayed
3. If an image file doesn't exist, the system will fallback to emoji icons
4. The images are displayed in the candidate cards and vote confirmation modal

## Adding New Symbols

If you need to add support for new party symbols:

1. Upload the image file to this directory with an appropriate filename
2. Update the `getSymbolImagePath` function in `src/app/dashboard/page.tsx` to map the symbol name to your new image file

Example mapping:
```typescript
const symbolMap: { [key: string]: string } = {
    'lotus': 'lotus.png',
    'hand': 'hand.png',
    // Add your new symbol here:
    'your-symbol-name': 'your-image-file.png',
}
```

## Current Symbols in Use

Based on `candidates.json`, the following symbols are currently used:
- Lotus (Bharatiya Janata Party)
- Hand (Indian National Congress)
- Book (Independent)
- Flaming Torch (Shiv Sena)

