-- Update the broadcast trigger function to use a new channel name
-- This might help Realtime recognize the schema change

DROP FUNCTION IF EXISTS room_changes_broadcast_trigger() CASCADE;

-- Create function with new name for clarity
CREATE OR REPLACE FUNCTION event_changes_broadcast_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM pg_notify(
      'event_changes',  -- Changed from 'room_changes'
      json_build_object(
        'table', TG_TABLE_NAME,
        'event_id', NEW.event_id,
        'operation', TG_OP,
        'record', row_to_json(NEW)
      )::text
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM pg_notify(
      'event_changes',  -- Changed from 'room_changes'
      json_build_object(
        'table', TG_TABLE_NAME,
        'event_id', OLD.event_id,
        'operation', TG_OP,
        'record', row_to_json(OLD)
      )::text
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers on messages table
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON messages;
CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION event_changes_broadcast_trigger();

-- Recreate triggers on presence table
DROP TRIGGER IF EXISTS presence_broadcast_trigger ON presence;
CREATE TRIGGER presence_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON presence
  FOR EACH ROW
  EXECUTE FUNCTION event_changes_broadcast_trigger();

-- Verify triggers are created
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
    AND p.proname LIKE '%event%broadcast%'
ORDER BY 
    c.relname;
