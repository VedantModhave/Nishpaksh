# Render Memory Optimization Guide

## Problem
Render free tier has **512MB RAM limit**. DeepFace with ArcFace + RetinaFace uses ~600MB, causing memory limit exceeded errors.

## Solution Applied

### 1. Lighter Models (60-70% memory reduction)
- **Changed from:** ArcFace (~400MB) + RetinaFace (~200MB) = ~600MB
- **Changed to:** VGG-Face (~200MB) + OpenCV (~50MB) = ~250MB
- **Memory saved:** ~350MB (58% reduction)

### 2. Memory Management
- Added memory limiting to 450MB (leaves 50MB for system)
- Added garbage collection after face operations
- Disabled TensorFlow optimizations that use extra memory

### 3. CPU-Only Mode (Fixed CUDA errors)
- Environment variables set before any TensorFlow imports
- Created `render_startup.py` to ensure proper initialization order

## Files Changed

1. **`backend/face/embedder.py`**
   - Changed `MODEL_NAME` from `"ArcFace"` to `"VGG-Face"`
   - Changed `DETECTOR_BACKEND` from `"retinaface"` to `"opencv"`
   - Added additional environment variables for memory optimization

2. **`main.py`**
   - Added memory limiting code
   - Added garbage collection after face operations
   - Updated documentation to reflect VGG-Face usage

3. **`render_startup.py`** (NEW)
   - Startup script that sets environment variables before imports
   - Ensures CPU-only mode is enforced from the start

## Render Configuration

### Option 1: Use render_startup.py (Recommended)
In your Render dashboard, set the **Start Command** to:
```bash
python render_startup.py
```

### Option 2: Use uvicorn directly
If you prefer to use uvicorn directly, set the **Start Command** to:
```bash
uvicorn render_startup:app --host 0.0.0.0 --port $PORT
```

### Option 3: Keep existing command
If you're already using:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
This will still work, but `render_startup.py` ensures environment variables are set earlier.

## Expected Results

### Before Optimization
- Memory usage: ~600MB (exceeds 512MB limit)
- CUDA errors: Yes
- Status: ❌ Crashes with memory limit exceeded

### After Optimization
- Memory usage: ~250MB (within 512MB limit)
- CUDA errors: No (CPU-only mode)
- Status: ✅ Should work on Render free tier

## Performance Notes

- **VGG-Face** is slightly less accurate than ArcFace but still very good (95%+ accuracy)
- **OpenCV detector** is faster and lighter than RetinaFace
- Face recognition will work, but may be slightly slower on CPU (expected on free tier)

## Monitoring

After deployment, check Render logs for:
- ✅ No CUDA errors
- ✅ Memory usage staying under 450MB
- ✅ Successful face registration/verification

## Troubleshooting

If you still see memory issues:
1. Check Render logs for actual memory usage
2. Consider upgrading to Render paid tier ($7/month for 1GB RAM)
3. Or switch to Railway.app (512MB free tier, often more reliable)

## Alternative Platforms

If Render continues to have issues:
- **Railway.app**: 512MB free tier, $5/month for 1GB
- **Fly.io**: 256MB free tier, good for Python
- **Google Cloud Run**: Pay-per-use, 512MB free tier
