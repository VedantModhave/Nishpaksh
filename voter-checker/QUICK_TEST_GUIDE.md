# Quick Test Guide - Local Frontend with Deployed Backend

## ✅ Configuration Complete!

Your `.env.local` file has been updated with:
```
FASTAPI_URL=https://nishpaksh-dv76.onrender.com
```

## 🚀 Steps to Test

### Step 1: Restart Your Frontend Server

**IMPORTANT**: Next.js only reads `.env.local` when the server starts!

```powershell
# Stop current server (Ctrl+C in terminal where npm run dev is running)
# Then restart:
cd "C:\Users\modha\OneDrive\Desktop\Nishpaksh HackSync\Nishpaksh\voter-checker"
npm run dev
```

### Step 2: Test Backend Connection

Open these URLs in your browser to verify backend is working:

1. **Backend Root** (Health Check):
   - https://nishpaksh-dv76.onrender.com/
   - Should show: `{"message":"Voter ID Checker API",...}`

2. **API Documentation**:
   - https://nishpaksh-dv76.onrender.com/docs
   - Should show FastAPI interactive docs

### Step 3: Test from Frontend

1. Open your local frontend: http://localhost:3000
2. Go through the voting flow:
   - Search for a voter (EPIC number)
   - Try face registration
   - Try face verification
3. Check browser console (F12) for any errors

## 🔍 What to Check

### ✅ Success Indicators:
- No CORS errors in browser console
- Face registration/verification works
- API calls complete successfully
- Network tab shows requests to `nishpaksh-dv76.onrender.com`

### ⚠️ Common Issues:

**Backend Spinning Up (First Request):**
- First request after 15+ minutes of inactivity takes ~30 seconds
- This is normal for Render free tier
- Subsequent requests are fast

**CORS Errors:**
- Your backend already allows all origins (`allow_origins=["*"]`)
- If you see CORS errors, check the exact error message

**502/503 Errors:**
- Backend is spinning up (wait 30 seconds)
- Check Render dashboard for deployment status

## 📝 Current Configuration

**Backend URL**: https://nishpaksh-dv76.onrender.com  
**Local Frontend**: http://localhost:3000  
**Environment File**: `voter-checker/.env.local`

## 🎯 Test Checklist

- [ ] Backend root endpoint accessible
- [ ] API docs page loads
- [ ] Frontend dev server restarted
- [ ] Face registration works
- [ ] Face verification works
- [ ] No console errors

---

**Ready to test!** Restart your frontend server and try the features.
