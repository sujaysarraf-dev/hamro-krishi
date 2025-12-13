# Database Setup Guide

## Supabase Integration

This app uses Supabase for authentication and database management.

## Setup Instructions

### 1. Run the SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `schema.sql`
5. Click **Run** to execute the SQL

### 2. Verify Tables Created

After running the SQL, verify these tables were created:
- `user_profiles` - Stores user information and roles
- `farms` - Stores farm information (optional, for farmers)

### 3. Test Authentication

The login screens are now integrated with Supabase:
- **Farmer Login**: `/farmer-login`
- **Regular User Login**: `/regular-login`

### 4. Create Test Users

You can create test users through:
- Supabase Dashboard → Authentication → Users → Add User
- Or implement a signup screen (recommended)

## Database Schema

### user_profiles Table
- `id` (UUID) - References auth.users
- `email` (TEXT) - User email
- `phone` (TEXT) - User phone number (optional)
- `role` (TEXT) - Either 'farmer' or 'regular'
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

### farms Table (Optional)
- `id` (UUID) - Farm ID
- `farmer_id` (UUID) - References user_profiles
- `farm_name` (TEXT) - Name of the farm
- `location` (TEXT) - Farm location
- `farm_type` (TEXT) - Type of farm
- `description` (TEXT) - Farm description
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time

## Security

Row Level Security (RLS) is enabled on all tables:
- Users can only view/update their own profiles
- Farmers can only manage their own farms

## Notes

- The default role for new users is 'regular'
- User roles can be updated after signup
- Phone authentication is not yet implemented (email only for now)

