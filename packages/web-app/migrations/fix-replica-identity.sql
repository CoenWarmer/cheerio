-- Check replica identity for the tables (needed for realtime to work properly)
SELECT 
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'default (primary key)'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full'
        WHEN 'i' THEN 'index'
    END as replica_identity
FROM 
    pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND c.relname IN ('user_activity', 'messages', 'presence', 'event_members', 'events')
ORDER BY 
    c.relname;

-- Try to fix replica identity if it's not set properly
-- This is required for UPDATE and DELETE operations in realtime
ALTER TABLE user_activity REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE presence REPLICA IDENTITY FULL;
ALTER TABLE event_members REPLICA IDENTITY FULL;
ALTER TABLE events REPLICA IDENTITY FULL;

-- Verify the change
SELECT 
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'default (primary key)'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full'
        WHEN 'i' THEN 'index'
    END as replica_identity
FROM 
    pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND c.relname IN ('user_activity', 'messages', 'presence', 'event_members', 'events')
ORDER BY 
    c.relname;
