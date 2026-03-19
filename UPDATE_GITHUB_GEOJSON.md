# Update GitHub with Moved GeoJSON File

## ✅ File Successfully Renamed

The file has been renamed from `2025-ward-data (1).geojson` to `ward-data.geojson` in the correct location.

**Current Location**: `voter-checker/public/ward-data.geojson` ✅

## Git Commands to Update GitHub

Run these commands in your repository:

```powershell
# Navigate to project root
cd "C:\Users\modha\OneDrive\Desktop\Nishpaksh HackSync\Nishpaksh"

# Remove the old file from root (if it exists in git)
git rm "2025-ward-data (1).geojson"

# Add the new file in the correct location
git add "voter-checker/public/ward-data.geojson"

# Commit the changes
git commit -m "Move and rename ward data GeoJSON to public/ward-data.geojson"

# Push to GitHub
git push origin main
```

## Alternative: If Git Commands Don't Work

If you're not using Git locally, use GitHub's web interface:

1. **Delete the old file from root:**
   - Go to GitHub repository
   - Click on `2025-ward-data (1).geojson` in root
   - Click "Delete" (trash icon)
   - Commit the deletion

2. **The new file should already be there:**
   - Navigate to `voter-checker/public/`
   - You should see `ward-data.geojson`
   - If not, click "Add file" → "Upload files"
   - Upload `ward-data.geojson`

## Verification

After updating GitHub:

1. ✅ File should be at: `voter-checker/public/ward-data.geojson`
2. ✅ File should NOT be in root directory
3. ✅ API route will find it automatically
4. ✅ Ward detection will work in dashboard

## File Status

- **Location**: `voter-checker/public/ward-data.geojson` ✅
- **API Route**: Already configured to read from this location ✅
- **Git**: Should be tracked (not ignored) ✅

---

**The file is ready!** Just update GitHub to reflect the new location.
