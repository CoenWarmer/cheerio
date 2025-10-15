-- Check the current definition of the broadcast trigger function
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proname LIKE '%broadcast%'
ORDER BY 
    p.proname;

-- Check what triggers are using this function
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM 
    pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
WHERE 
    c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND p.proname LIKE '%broadcast%'
ORDER BY 
    c.relname;
