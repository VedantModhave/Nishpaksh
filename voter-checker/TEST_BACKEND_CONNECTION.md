# Test Deployed Backend with Local Frontend

## ✅ Backend Deployed Successfully!

Your backend is live at: **https://nishpaksh-dv76.onrender.com**

## Step 1: Create/Update `.env.local` File

Create or update `voter-checker/.env.local` with the following:

```env
# FastAPI Backend URL (Deployed on Render)
FASTAPI_URL=https://nishpaksh-dv76.onrender.com

# Blockchain Configuration (optional - only if using blockchain features)
# SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# PRIVATE_KEY=your_private_key_here
```

### How to Create the File:

**Option A: Using PowerShell**
```powershell
cd "C:\Users\modha\OneDrive\Desktop\Nishpaksh HackSync\Nishpaksh\voter-checker"
@"
FASTAPI_URL=https://nishpaksh-dv76.onrender.com
"@ | Out-File -FilePath ".env.local" -Encoding utf8
```

**Option B: Manually**
1. Navigate to `voter-checker` folder
2. Create a new file named `.env.local`
3. Add the content above

## Step 2: Restart Your Frontend Dev Server

After creating/updating `.env.local`, restart your Next.js dev server:

```powershell
# Stop the current server (Ctrl+C if running)
# Then restart:
cd "C:\Users\modha\OneDrive\Desktop\Nishpaksh HackSync\Nishpaksh\voter-checker"
npm run dev
```

**Important**: Next.js only reads `.env.local` on server start, so you must restart!

## Step 3: Test the Connection

### Test 1: Backend Health Check
Open in browser: https://nishpaksh-dv76.onrender.com/

Should return:
```json
{
  "message": "Voter ID Checker API",
  "version": "1.0.0",
  "endpoints": {
    "generate_captcha": "GET /captcha/generate",
    "search_voter": "POST /voter/search",
    "face_register": "POST /face/register",
    "face_verify": "POST /face/verify"
  }
}
```

### Test 2: API Documentation
Open in browser: https://nishpaksh-dv76.onrender.com/docs

Should show FastAPI interactive documentation.

### Test 3: Test Face Registration (via Frontend)
1. Start your local frontend: `npm run dev`
2. Go to http://localhost:3000
3. Search for a voter
4. Try face registration/verification
5. Check browser console for any errors

## Step 4: Verify Environment Variable

Check if the environment variable is loaded:

```powershell
# In voter-checker directory
Get-Content .env.local
```

Should show:
```
FASTAPI_URL=https://nishpaksh-dv76.onrender.com
```

## Troubleshooting

### Issue: Frontend still uses localhost:8000
**Solution**: 
- Make sure `.env.local` is in `voter-checker/` directory (not root)
- Restart the Next.js dev server completely
- Check for typos in the URL

### Issue: CORS Errors
**Solution**: 
- Your backend already has CORS configured to allow all origins (`allow_origins=["*"]`)
- If you still get CORS errors, check browser console for exact error

### Issue: Backend is Slow/Spinning Up
**Solution**: 
- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Subsequent requests are fast
- Consider upgrading to paid tier for always-on service

### Issue: 502 Bad Gateway
**Solution**:
- Backend might be spinning up (wait 30 seconds and retry)
- Check Render dashboard for deployment status
- Check Render logs for errors

## Expected Behavior

✅ **Working Connection:**
- Face registration should work
- Face verification should work
- No CORS errors in browser console
- API calls succeed

❌ **Not Working:**
- CORS errors in console
- Network errors
- 502/503 errors (backend spinning up)

## Next Steps

After testing locally:
1. Deploy frontend to Vercel
2. Update Vercel environment variables with same `FASTAPI_URL`
3. Test full stack in production

---

**Backend URL**: https://nishpaksh-dv76.onrender.com  
**API Docs**: https://nishpaksh-dv76.onrender.com/docs  
**Health Check**: https://nishpaksh-dv76.onrender.com/
