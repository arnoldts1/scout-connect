# Scout Connect — Supabase Setup

## 1. Create Project at supabase.com → New Project

## 2. Run Database Migration
SQL Editor → paste migrations/001_initial_schema.sql → Run

## 3. Create Storage Buckets
Dashboard → Storage → New bucket:
| Name      | Public |
|-----------|--------|
| avatars   | Yes    |
| media     | Yes    |
| audio     | Yes    |
| documents | No     |

Add policies for each: SELECT USING(TRUE), INSERT WITH CHECK(auth.uid() IS NOT NULL)

## 4. Set Environment Variables
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Set First Admin
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

## 6. Run
```bash
npm install && npm run dev
```
