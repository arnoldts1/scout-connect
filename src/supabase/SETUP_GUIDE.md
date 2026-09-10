# Scout Connect — Supabase Setup Guide

## 1. Create a Supabase Project
1. Go to https://supabase.com → New Project
2. Choose a name (e.g. `scout-connect`), region, and a strong database password
3. Wait for the project to be provisioned (~2 min)

## 2. Run the Database Migration
1. In Supabase Dashboard → **SQL Editor**
2. Run every file in `supabase/migrations/` in numeric order.
3. Paste each file's contents into the SQL Editor and run it before moving to the next file.

## 3. Create Storage Buckets
In Supabase Dashboard → **Storage** → **New bucket**:

| Bucket name | Public? |
|-------------|---------|
| `avatars`   | ✅ Yes  |
| `media`     | ✅ Yes  |
| `audio`     | ✅ Yes  |
| `documents` | ❌ No   |

For each bucket, add policies (Storage → Policies):
- `SELECT` — `TRUE` (for public buckets) or `auth.uid() IS NOT NULL` (documents)
- `INSERT` — `auth.uid() IS NOT NULL`
- `DELETE` — `auth.uid() IS NOT NULL`

## 4. Configure Environment Variables
In your project root, create `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Find these values in:
Supabase Dashboard → **Settings** → **API** → Project URL & anon/public key

## 5. Authentication Settings
In Supabase Dashboard → **Authentication** → **Settings**:
- Site URL: `http://localhost:5173` (dev) or your production URL
- Redirect URLs: add your production domain
- Enable **Email** provider (already on by default)

## 6. Enable Realtime (optional)
Already handled by the SQL migration (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`).
Verify in Dashboard → **Database** → **Replication** → `supabase_realtime`.

## 7. Set First Admin
After registering your account, run in SQL Editor:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

## 8. Start the App
```bash
npm install
npm run dev
```

## Architecture Overview

```
Frontend (React + Vite)
  └── api/base44Client.js       ← re-exports supabaseClient
      └── api/supabaseClient.js ← assembles auth + entities + integrations
          ├── api/supabaseAuth.js        ← Supabase Auth (login, signup, me)
          ├── api/supabaseEntities.js    ← Supabase DB CRUD (all 33 tables)
          ├── api/supabaseStorage.js     ← Supabase Storage (file uploads)
          └── api/supabaseIntegrations.js← UploadFile shim

lib/supabase.js          ← createClient singleton
lib/AuthContext.jsx      ← session management via onAuthStateChange

supabase/
  migrations/001_initial_schema.sql  ← full PostgreSQL schema + RLS
  SETUP_GUIDE.md                     ← this file
```

## What Changed vs Base44

| Feature            | Before (Base44)              | After (Supabase)                        |
|--------------------|------------------------------|-----------------------------------------|
| Auth               | Base44 SDK token             | Supabase Auth (JWT, sessions)           |
| Database           | Base44 managed DB            | Supabase PostgreSQL + RLS               |
| File uploads       | Base44 storage               | Supabase Storage buckets                |
| Realtime           | Base44 subscribe()           | Supabase Realtime postgres_changes      |
| API client         | `@base44/sdk`                | `@supabase/supabase-js`                 |
| Import path        | unchanged                    | unchanged (`@/api/base44Client`)        |

No page or component files were modified — only the API layer was swapped.