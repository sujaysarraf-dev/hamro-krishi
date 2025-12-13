# How to Disable Email Confirmation in Supabase

## Step-by-Step Instructions

### Method 1: Disable Email Confirmation in Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select your project

2. **Open Authentication Settings**
   - Click on **"Authentication"** in the left sidebar
   - Click on **"Providers"** or **"Settings"**

3. **Disable Email Confirmation**
   - Look for **"Email Auth"** section
   - Find **"Enable email confirmations"** toggle
   - **Turn OFF** the toggle (disable it)
   - Click **"Save"**

4. **Alternative Path (if above doesn't work)**
   - Go to **Authentication** > **URL Configuration**
   - Or go to **Project Settings** > **Authentication**
   - Look for **"Email"** settings
   - Disable **"Confirm email"** or **"Enable email confirmations"**

### Method 2: Using SQL (Alternative)

If you have access to the auth schema, you can run:

```sql
-- Update auth configuration to disable email confirmation
-- Note: This may not work depending on your Supabase plan
UPDATE auth.config 
SET enable_signup = true, 
    enable_email_confirmations = false;
```

**Note:** This SQL method may not be available on all Supabase plans. The dashboard method is recommended.

### Method 3: Auto-Confirm Users When Creating Through Dashboard

When manually creating users in the dashboard:
1. Go to **Authentication** > **Users**
2. Click **"Add User"**
3. Fill in the email and password
4. **Check "Auto Confirm User"** checkbox
5. Click **"Create User"**

This will create users without requiring email confirmation.

## Verify It's Working

After disabling email confirmation:

1. Try signing up a new user through the app
2. The user should be able to log in immediately without confirming email
3. Check the user in **Authentication** > **Users** - they should show as "Confirmed"

## Important Notes

- ⚠️ **Security**: Disabling email confirmation reduces security. Only do this for development/testing.
- ✅ **For Production**: Consider keeping email confirmation enabled for better security.
- 🔄 **Existing Users**: Users created before disabling confirmation may still need to confirm their email.

## Troubleshooting

If users still can't log in after disabling confirmation:

1. Check if the user exists in **Authentication** > **Users**
2. If the user shows as "Unconfirmed", you can manually confirm them:
   - Click on the user
   - Click **"Confirm User"** or **"Send confirmation email"**
3. Or delete and recreate the user with "Auto Confirm User" checked
