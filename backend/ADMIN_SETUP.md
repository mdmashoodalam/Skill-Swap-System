# Admin Account Setup - Manual Steps

## Option 1: Using MySQL Workbench GUI (Easiest)

1. **Open MySQL Workbench 8.0**
   - Search for "MySQL Workbench" in Windows Start Menu
   - Open it and connect to your local MySQL server

2. **Execute the SQL Script**
   - In Workbench, open File → Open SQL Script
   - Navigate to: `c:\Users\masho\Downloads\skill-swap-platform\backend\create_admin.sql`
   - Click the lightning bolt icon to execute
   - You should see: "Admin created successfully"

3. **Verify Creation**
   - Run this query:
   ```sql
   SELECT id, email, role, created_at FROM users WHERE email = 'admin@skillswap.com';
   ```
   - Should return one row with role='ADMIN'

4. **Test Login**
   - Go to http://localhost:5173/login
   - Email: `admin@skillswap.com`
   - Password: `admin123`
   - Should login successfully!

---

## Option 2: Direct SQL Command (Copy-Paste)

If MySQL Workbench isn't working, you can use MySQL Command Line Client:

1. Open Command Prompt (cmd.exe) as Administrator
2. Run:
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot
   ```
3. Paste these commands:
   ```sql
   USE skill_swap;
   INSERT INTO users (full_name, email, password_hash, role, rating_avg, total_reviews, created_at, updated_at) 
   VALUES ('Admin User', 'admin@skillswap.com', '$2a$10$9i4l2QFjDYbVj.F8I0RvSe2lZGTWO8Uw80ZVXCvyqDn5pKPDKd0Dm', 'ADMIN', 0.0, 0, NOW(), NOW());
   SELECT * FROM users WHERE email = 'admin@skillswap.com';
   EXIT;
   ```

---

## Option 3: Restart Backend (Auto-Create)

If DataInitializer wasn't run when backend started:

1. **Stop the backend** (if running)
2. **Delete the admin user** from database (if exists)
3. **Restart backend** 
   - DataInitializer will auto-create admin on startup
   - Check console for: "✓ Admin user created: admin@skillswap.com / admin123"

---

## ✅ After Setup Complete

Once admin account is created:

1. **Frontend URL**: http://localhost:5173
2. **Login Credentials**:
   - Email: `admin@skillswap.com`
   - Password: `admin123`
3. **First Login**:
   - You'll see Dashboard with user stats
   - Profile is accessible and editable
   - All features should work now!

---

## If Login Still Fails (401 Unauthorized)

The most likely causes:

1. **Admin user not in database** - Verify with:
   ```sql
   SELECT * FROM users WHERE email = 'admin@skillswap.com';
   ```

2. **Wrong password hash** - Check what's stored matches role 'ADMIN'

3. **JWT token issue** - Try clearing browser cache/localStorage:
   - F12 → Application → Local Storage → Clear all
   - Reload http://localhost:5173

4. **Backend not recompiled** - Make sure backend has latest code changes

---

## Need Help?

Check these files:
- SQL Script: `c:\Users\masho\Downloads\skill-swap-platform\backend\create_admin.sql`
- Frontend: `c:\Users\masho\Downloads\skill-swap-platform\frontend`
- Backend: `c:\Users\masho\Downloads\skill-swap-platform\backend`
