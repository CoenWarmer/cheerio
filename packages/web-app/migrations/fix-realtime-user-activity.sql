-- Fix Realtime replication for user_activity table
-- This removes and re-adds the table to ensure all columns are properly registered

-- Remove the table from realtime publication
-- Ignore error if table is not in publication
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE user_activity;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL; -- Table wasn't in publication, that's fine
END $$;

-- Re-add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;

-- Verify the change
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_activity';
