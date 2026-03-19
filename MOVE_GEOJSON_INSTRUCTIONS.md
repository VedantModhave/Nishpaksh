# Instructions to Move GeoJSON File from GitHub

## Step 1: Download the File from GitHub

Since the file exists on GitHub but not locally, you need to download it first.

### Option A: Download Directly from GitHub
1. Go to your GitHub repository
2. Click on `2025-ward-data (1).geojson`
3. Click the "Raw" button
4. Save the file to: `voter-checker/public/ward-data.geojson`

### Option B: Use Git to Pull the File
```powershell
# If you have the repo cloned, pull the latest
git pull origin main

# Then the file should appear in root
```

## Step 2: Move the File to Correct Location

Once you have the file locally:

```powershell
# Navigate to project root
cd "C:\Users\modha\OneDrive\Desktop\Nishpaksh HackSync\Nishpaksh"

# Create public directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "voter-checker/public"

# Move the file to the correct location
Move-Item "2025-ward-data (1).geojson" "voter-checker/public/ward-data.geojson"
```

## Step 3: Update Git Tracking

```powershell
# Remove the old file from git (but keep it locally - already moved)
git rm "2025-ward-data (1).geojson"

# Add the new file in the correct location
git add "voter-checker/public/ward-data.geojson"

# Commit the change
git commit -m "Move ward data GeoJSON to public folder"

# Push to GitHub
git push origin main
```

## Step 4: Verify

```powershell
# Check the file is in the new location
Test-Path "voter-checker/public/ward-data.geojson"

# Check git status
git status
```

---

## Quick One-Liner (if file exists locally)

```powershell
cd "C:\Users\modha\OneDrive\Desktop\Nishpaksh HackSync\Nishpaksh"
New-Item -ItemType Directory -Force -Path "voter-checker/public"
Move-Item "2025-ward-data (1).geojson" "voter-checker/public/ward-data.geojson"
git rm "2025-ward-data (1).geojson"
git add "voter-checker/public/ward-data.geojson"
git commit -m "Move ward data GeoJSON to public folder"
git push origin main
```
