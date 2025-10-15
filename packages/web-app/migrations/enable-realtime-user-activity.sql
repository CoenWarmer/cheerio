-- Enable Realtime replication for user_activity table
-- This allows the web app to receive real-time updates when new activities are inserted

-- Note: This must also be enabled in the Supabase Dashboard:
-- Database -> Replication -> Find "user_activity" -> Toggle "Enable"

-- Alternatively, you can enable it via SQL (if you have the right permissions):
ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;

-- If the above doesn't work, you need to:
-- 1. Go to your Supabase Dashboard: https://app.supabase.com
-- 2. Select your project
-- 3. Go to Database -> Replication
-- 4. Find the "user_activity" table
-- 5. Toggle the switch to enable replication
