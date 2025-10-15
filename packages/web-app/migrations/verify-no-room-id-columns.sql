-- Check if any room_id columns still exist in the database
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND column_name LIKE '%room%'
ORDER BY 
    table_name, 
    ordinal_position;

-- Also check the actual columns in our key tables
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('user_activity', 'messages', 'presence', 'event_members', 'events')
    AND column_name IN ('room_id', 'event_id')
ORDER BY 
    table_name, 
    ordinal_position;
