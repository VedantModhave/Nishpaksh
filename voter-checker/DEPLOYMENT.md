# Deployment Guide for Nishpaksh Voting Platform

This guide will help you deploy the Next.js frontend application to production.

## Prerequisites

1. **Node.js** (v18 or higher) installed
2. **Git** installed
3. **Account** on a hosting platform (Vercel recommended for Next.js)
4. **Backend API** running (if using face recognition features)

## Step 1: Fix TypeScript Error (Already Fixed ✅)

The TypeScript error in `LanguageContext.tsx` has been resolved. The `t` function now correctly accepts optional string arguments for placeholder replacement.

## Step 2: Build the Project Locally

Test the build process before deploying:

```powershell
cd voter-checker
npm install
npm run build
```

If the build succeeds, you're ready to deploy!

## Step 3: Environment Variables

Create a `.env.local` file in the `voter-checker` directory (if not already present):

```env
# FastAPI Backend URL (optional - defaults to http://localhost:8000)
FASTAPI_URL=http://localhost:8000

# For production, update to your backend URL:
# FASTAPI_URL=https://your-backend-api.com
```

**Note:** If you're not using face recognition features, you can skip this variable.

## Step 4: Choose Deployment Platform

### Option A: Vercel (Recommended for Next.js)

Vercel is the easiest and most optimized platform for Next.js applications.

#### Steps:

1. **Install Vercel CLI** (optional, for CLI deployment):
   ```powershell
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your Git repository
   - Configure:
     - **Framework Preset:** Next.js
     - **Root Directory:** `voter-checker`
     - **Build Command:** `npm run build`
     - **Output Directory:** `.next`
     - **Install Command:** `npm install`

3. **Add Environment Variables:**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add `FASTAPI_URL` if needed

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Deploy via CLI:
```powershell
cd voter-checker
vercel
```

### Option B: Netlify

1. **Install Netlify CLI:**
   ```powershell
   npm install -g netlify-cli
   ```

2. **Build the project:**
   ```powershell
   npm run build
   ```

3. **Deploy:**
   ```powershell
   netlify deploy --prod
   ```

4. **Configure in Netlify Dashboard:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variables in Site Settings

### Option C: Traditional Hosting (VPS/Cloud)

For platforms like AWS, DigitalOcean, or any VPS:

1. **Build the project:**
   ```powershell
   npm run build
   ```

2. **Start production server:**
   ```powershell
   npm start
   ```

3. **Use PM2 for process management:**
   ```powershell
   npm install -g pm2
   pm2 start npm --name "nishpaksh" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure reverse proxy (Nginx example):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Step 5: Post-Deployment Checklist

- [ ] Verify the site loads correctly
- [ ] Test voter search functionality
- [ ] Test wallet connection (MetaMask)
- [ ] Verify all pages load (Home, Dashboard, Results, Privacy Policy, Terms)
- [ ] Check mobile responsiveness
- [ ] Test language switching (English, Hindi, Marathi)
- [ ] Verify footer appears on all pages
- [ ] Test blockchain voting functionality (if applicable)

## Step 6: Custom Domain (Optional)

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS records

## Troubleshooting

### Build Errors:
- Ensure all dependencies are installed: `npm install`
- Clear `.next` folder: `rm -rf .next` (or `Remove-Item -Recurse -Force .next` in PowerShell)
- Check Node.js version: `node --version` (should be 18+)

### Runtime Errors:
- Check environment variables are set correctly
- Verify backend API is accessible (if using face recognition)
- Check browser console for client-side errors

### Performance:
- Enable Next.js Image Optimization
- Consider using CDN for static assets
- Enable compression on your hosting platform

## Production Optimizations

1. **Enable Compression:**
   - Vercel/Netlify handle this automatically
   - For custom hosting, configure gzip compression

2. **Set up Monitoring:**
   - Consider adding error tracking (Sentry, LogRocket)
   - Monitor API response times

3. **Security:**
   - Ensure HTTPS is enabled
   - Review and update CORS settings if needed
   - Keep dependencies updated: `npm audit`

## Support

For issues or questions:
- Check the project README.md
- Review Next.js documentation: https://nextjs.org/docs
- Check Vercel documentation: https://vercel.com/docs

---

**Quick Deploy Command (Vercel):**
```powershell
cd voter-checker
npm install
npm run build
vercel --prod
```
