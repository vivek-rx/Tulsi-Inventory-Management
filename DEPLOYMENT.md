# Tulsi Inventory Management - Deployment Instructions

## ✅ Step 1: Frontend is Ready for Vercel

Your frontend is now configured as a **static site** and will deploy automatically on Vercel.

**What was done:**
- Removed `/api` directory (Python backend)
- Updated `vercel.json` for static site deployment
- Configured `frontend/src/api.ts` to use environment variable for backend URL

---

## 🚀 Step 2: Deploy Backend to Railway

### A. Create Railway Account & Deploy

1. Go to **[Railway.app](https://railway.app)** and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select **`Tulsi-Inventory-Management`** repository
4. Railway will auto-detect Python and deploy from root

### B. Configure Railway

1. **Settings** → **Root Directory**: Set to `backend`
2. **Settings** → **Start Command**: 
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
3. **Variables** tab → Add these environment variables:
   ```
   DATABASE_URL=postgresql://postgres:jWbmaRhnGPpYrRgP@db.zwlkrnsefjwxqeilosuc.supabase.co:5432/postgres
   SECRET_KEY=E7Xy6FZbd-0gBl3AoOvH69YeIJcmxH1uLnH0CXQV4vw
   USE_SUPABASE=true
   ```

4. **Deploy** → Railway will give you a URL like:
   ```
   https://tulsi-inventory-production.up.railway.app
   ```

---

## 🔗 Step 3: Connect Frontend to Backend

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add this variable:
   ```
   Name: VITE_API_URL
   Value: https://your-railway-url.up.railway.app
   ```
   (Replace with your actual Railway URL)
3. **Save**
4. Go to **Deployments** → **Redeploy** latest deployment

---

## ✅ Step 4: Test Everything

1. **Backend Health Check:**
   - Visit: `https://your-railway-url.up.railway.app/api/summary`
   - Should return JSON data

2. **Frontend:**
   - Visit: `https://tulsi-inventory.vercel.app`
   - Should show login page

3. **Login:**
   - Username: `admin`
   - Password: `admin123`
   - Should successfully authenticate and load dashboard

---

## 📝 Summary

**Frontend (Vercel):**
- ✅ Configured for static site deployment
- ✅ Will auto-deploy on every push to `main`
- ✅ Uses `VITE_API_URL` environment variable

**Backend (Railway):**
- ⏳ Needs to be deployed (follow Step 2)
- ⏳ Needs environment variables configured
- ⏳ URL needs to be added to Vercel

**Estimated Time:** 10-15 minutes

---

## 🆘 Troubleshooting

**If login fails:**
1. Check Railway logs for errors
2. Verify environment variables are set correctly
3. Make sure `VITE_API_URL` in Vercel matches Railway URL exactly
4. Check browser console for CORS errors

**If frontend doesn't load:**
1. Check Vercel build logs
2. Make sure `frontend/dist` directory exists after build
3. Try manual redeploy in Vercel dashboard
