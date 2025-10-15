-- Refresh the realtime publication to pick up schema changes
-- This will ensure Realtime uses the updated column names (event_id instead of room_id)

-- First, check what's currently in the publication
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    tablename;

-- Refresh the publication by removing and re-adding tables
-- This forces Supabase Realtime to re-read the table schema

-- Note: These commands might fail if tables aren't in the publication, but that's OK
DO $$
BEGIN
    -- Try to drop tables from publication (ignore errors if they're not there)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE user_activity;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE messages;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE presence;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE event_members;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Add tables back to publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;
ALTER PUBLICATION supabase_realtime ADD TABLE event_members;

-- Verify tables are back in the publication
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
ORDER BY 
    tablename;
