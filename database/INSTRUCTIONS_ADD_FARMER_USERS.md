# Instructions to Add Farmer Users

## Quick Method (Recommended)

### Step 1: Create Users in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"** button

#### For kavyan@gmail.com:
- **Email**: `kavyan@gmail.com`
- **Password**: `123456`
- **Auto Confirm User**: ✅ Check this (to skip email confirmation)
- Click **"Create User"**

#### For sahid@gmail.com:
- **Email**: `sahid@gmail.com`
- **Password**: `123456`
- **Auto Confirm User**: ✅ Check this (to skip email confirmation)
- Click **"Create User"**

### Step 2: Run SQL to Create Profiles

After creating both users, go to **SQL Editor** and run:

```sql
-- For kavyan@gmail.com
INSERT INTO user_profiles (id, email, role, full_name)
SELECT 
    id,
    email,
    'farmer'::text,
    'Kavyan'::text
FROM auth.users
WHERE email = 'kavyan@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    role = 'farmer',
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = TIMEZONE('utc'::text, NOW());

-- For sahid@gmail.com
INSERT INTO user_profiles (id, email, role, full_name)
SELECT 
    id,
    email,
    'farmer'::text,
    'Sahid'::text
FROM auth.users
WHERE email = 'sahid@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    role = 'farmer',
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = TIMEZONE('utc'::text, NOW());
```

### Step 3: Verify

Check that the users were created:
```sql
SELECT id, email, role, full_name 
FROM user_profiles 
WHERE email IN ('kavyan@gmail.com', 'sahid@gmail.com');
```

Both users should show `role = 'farmer'`.

## Alternative: Using Supabase Management API

If you prefer to automate this, you can use the Supabase Management API or create a script using the Admin client.

## Notes

- The password `123456` is for development only. Change it in production.
- Both users will have the `farmer` role and can access farmer features.
- The `ON CONFLICT` clause ensures the profile is updated if it already exists.

