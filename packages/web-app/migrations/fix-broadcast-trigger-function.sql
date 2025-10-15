-- Update the room_changes_broadcast_trigger function to use event_id instead of room_id
-- This function is used by triggers on messages and presence tables

-- First, let's see the current function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'room_changes_broadcast_trigger';

-- Drop and recreate the function with updated column reference
DROP FUNCTION IF EXISTS room_changes_broadcast_trigger() CASCADE;

-- Recreate the function with event_id
CREATE OR REPLACE FUNCTION room_changes_broadcast_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about changes using event_id instead of room_id
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM pg_notify(
      'room_changes',
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
      'room_changes',
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

-- Recreate the triggers
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON messages;
CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION room_changes_broadcast_trigger();

DROP TRIGGER IF EXISTS presence_broadcast_trigger ON presence;
CREATE TRIGGER presence_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON presence
  FOR EACH ROW
  EXECUTE FUNCTION room_changes_broadcast_trigger();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Updated room_changes_broadcast_trigger function to use event_id';
  RAISE NOTICE '✅ Recreated triggers on messages and presence tables';
  RAISE NOTICE '';
END $$;
