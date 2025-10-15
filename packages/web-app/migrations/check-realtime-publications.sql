-- Check the realtime publication to see what columns are being replicated
SELECT 
    schemaname,
    tablename,
    attname as column_name
FROM 
    pg_publication_tables ppt
    JOIN pg_attribute pa ON pa.attrelid = (ppt.schemaname || '.' || ppt.tablename)::regclass
WHERE 
    ppt.pubname = 'supabase_realtime'
    AND ppt.tablename IN ('user_activity', 'messages', 'presence', 'event_members')
    AND pa.attnum > 0
    AND NOT pa.attisdropped
ORDER BY 
    ppt.tablename, 
    pa.attnum;

-- Also check if any columns named 'room_id' still exist in these tables
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('user_activity', 'messages', 'presence', 'event_members', 'events')
    AND column_name LIKE '%room%'
ORDER BY 
    table_name, 
    ordinal_position;
