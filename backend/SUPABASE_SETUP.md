# 🚀 Quick Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Tulsi-Inventory-Mmt
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to you
4. Wait for project to initialize (~2 minutes)

## Step 2: Get Your Credentials

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Copy the **URI** (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@...`)
4. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Run SQL Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `supabase_schema.sql`
4. Paste and click **Run**
5. You should see "Success. No rows returned"

## Step 4: Configure Backend

1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and update:
   ```env
   SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
   USE_SUPABASE=true
   ```

## Step 5: Test Connection

1. Stop the current server (Ctrl+C in terminal)
2. Restart:
   ```bash
   python -m uvicorn main:app --reload
   ```
3. Look for: `✅ Connected to Supabase PostgreSQL`

## Step 6: Verify Tables

1. Go to Supabase Dashboard → **Table Editor**
2. You should see all tables:
   - production_records
   - production_orders
   - batch_tracking
   - stage_inventory
   - etc.

---

## 🔄 Rollback to SQLite

If you need to go back to SQLite:

1. Edit `.env`:
   ```env
   USE_SUPABASE=false
   ```
2. Restart server

---

## ✅ Next Steps After Migration

- [ ] Test creating an order
- [ ] Test creating a coil/batch
- [ ] Test logging production
- [ ] Verify data appears in Supabase dashboard
- [ ] Deploy backend to cloud (Render, Railway, etc.)

---

## 🆘 Troubleshooting

**Error: "SUPABASE_DB_URL not found"**
- Make sure `.env` file exists in `backend/` folder
- Check that `USE_SUPABASE=true` is set

**Error: "could not connect to server"**
- Verify your database password is correct
- Check your internet connection
- Ensure Supabase project is active

**Tables not showing**
- Re-run the SQL schema in Supabase SQL Editor
- Check for error messages in the SQL output
