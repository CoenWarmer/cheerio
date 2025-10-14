-- Create enum type for user permissions
CREATE TYPE user_permission AS ENUM ('admin', 'tracker', 'supporter');

-- Add permissions column to profiles table with default 'supporter'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS permissions user_permission DEFAULT 'supporter' NOT NULL;

-- Create index for faster permission queries
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON profiles(permissions);

-- Optional: Update existing users to have default permission
UPDATE profiles SET permissions = 'supporter' WHERE permissions IS NULL;

