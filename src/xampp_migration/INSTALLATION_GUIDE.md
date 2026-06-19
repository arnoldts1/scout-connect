# Scout Connect — XAMPP Migration Installation Guide

## Prerequisites
- **XAMPP** ≥ 8.1 (PHP 8.1+, MySQL 8.0+, Apache)
- **Node.js** ≥ 18 + npm/pnpm
- **Git** (optional)

---

## 1. Database Setup

1. Start **MySQL** in XAMPP Control Panel.
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Create a new database named `scout_connect` (UTF-8 / utf8mb4_unicode_ci).
4. Click **Import** → select `xampp_migration/database.sql` → Execute.

---

## 2. Backend Setup

```bash
# Copy the backend into XAMPP's web root
cp -r xampp_migration/backend  C:/xampp/htdocs/scout_connect/backend
# Windows: use Explorer or robocopy
```

### Configure environment

```bash
cd C:/xampp/htdocs/scout_connect/backend
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_NAME=scout_connect
DB_USER=root
DB_PASS=          # leave blank for default XAMPP
JWT_SECRET=replace_with_a_long_random_string
APP_URL=http://localhost/scout_connect/backend
FRONTEND_URL=http://localhost:5173
```

### Enable mod_rewrite (Apache)

Open `C:/xampp/apache/conf/httpd.conf`, find the `<Directory "C:/xampp/htdocs">` block and ensure:
```apache
AllowOverride All
```
Restart Apache.

### Create upload directory

```bash
mkdir C:/xampp/htdocs/scout_connect/backend/uploads
chmod 775 uploads   # Linux/Mac only
```

---

## 3. Frontend Setup

```bash
# Copy migrated API files
cp xampp_migration/frontend/api/client.js     src/api/client.js
cp xampp_migration/frontend/api/auth.js       src/api/auth.js
cp xampp_migration/frontend/api/entities.js   src/api/entities.js
cp xampp_migration/frontend/api/index.js      src/api/index.js   # replaces base44Client.js
cp xampp_migration/frontend/AuthContext.jsx   src/lib/AuthContext.jsx
cp xampp_migration/frontend/vite.config.js    vite.config.js
```

Create `.env.local` in the project root:
```
VITE_API_URL=http://localhost/scout_connect/backend
```

Install dependencies and run:
```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 4. File / Image Uploads

Uploaded files are saved to `backend/uploads/` and served at:
```
http://localhost/scout_connect/backend/uploads/{filename}
```

The `VITE_API_URL` prefix is prepended automatically by the upload endpoint response.

---

## 5. Removing Base44 Dependencies

After verifying the migrated API works:

```bash
npm uninstall @base44/sdk @base44/vite-plugin
```

Remove the Base44 plugin from `vite.config.js` (already done in the migrated config).

---

## 6. Production Deployment (VPS / cPanel)

1. Upload `backend/` to your PHP-capable host (e.g. `public_html/api/`).
2. Update `.env` with production DB credentials and `APP_URL`.
3. Build the React app: `npm run build`
4. Upload `dist/` to `public_html/` (or a subdirectory).
5. Update `VITE_API_URL` to your production domain before building.
6. Point a subdomain (e.g. `api.scoutconnect.com`) to the `backend/` folder.

---

## 7. Default Admin Account

After importing the database SQL, register the first user through the app, then manually promote them to admin in phpMyAdmin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| 404 on all API routes | Enable `mod_rewrite` and set `AllowOverride All` |
| CORS errors in browser | Check `config/cors.php` — ensure `FRONTEND_URL` matches exactly |
| JWT auth fails | Make sure `JWT_SECRET` in `.env` matches what was used to sign tokens |
| File upload fails | Check `uploads/` directory exists and is writable |
| Blank page after login | Check browser console for missing `VITE_API_URL` env var |