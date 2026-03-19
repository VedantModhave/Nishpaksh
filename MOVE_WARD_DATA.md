# Move Ward Data GeoJSON File

## ✅ Action Required

The `2025-ward-data (1).geojson` file is **needed** for the application - it's used for ward detection in the dashboard.

### Steps to Move the File:

1. **Download the file from GitHub** (if not already local):
   - The file is currently in the root directory on GitHub
   - Download it to your local machine

2. **Move it to the proper location**:
   ```powershell
   # If file exists in root
   Move-Item "2025-ward-data (1).geojson" "voter-checker/public/ward-data.geojson"
   
   # Or if downloading from GitHub, save directly to:
   # voter-checker/public/ward-data.geojson
   ```

3. **Verify the file is in place**:
   ```powershell
   Test-Path "voter-checker/public/ward-data.geojson"
   ```

## ✅ Code Already Updated

The API route (`voter-checker/src/app/api/ward-data/route.ts`) has been updated to:
- Only look in `public/ward-data.geojson` (proper Next.js location)
- Provide better error messages if file is missing

## ✅ Git Configuration Updated

The `.gitignore` has been updated to:
- Ignore all `*.geojson` files
- **EXCEPT** `voter-checker/public/ward-data.geojson` (this file should be tracked)

## 📝 Why This Location?

- **`voter-checker/public/`** is the standard Next.js location for static assets
- Files in `public/` are served directly and accessible via `/ward-data.geojson`
- This makes the file available in production deployments
- Better organization - data files with the frontend that uses them

## 🚀 After Moving

1. The file will be accessible at: `/api/ward-data`
2. The dashboard will automatically detect wards based on coordinates
3. The file will be included in git (it's needed for the app to work)
4. It will be deployed with the Next.js app automatically

---

**Note**: The file is ~634KB, which is acceptable for git. If it grows larger, consider using Git LFS.
