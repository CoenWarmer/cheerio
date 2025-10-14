# Update Rooms Table Schema

## Steps to Update Your Supabase Database

### 1. Run the Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy the contents of `migrations/update-rooms-table.sql`
6. Paste it into the SQL editor
7. Click **Run** or press `Cmd/Ctrl + Enter`

### 2. Verify the Changes

After running the migration, verify the table structure:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rooms'
ORDER BY ordinal_position;
```

You should see:

- `title` (TEXT) - Room title
- `description` (TEXT) - Room description
- `donation_link` (TEXT, nullable) - Optional donation link
- `start_time` (TIMESTAMPTZ, nullable) - When the room starts
- `status` (room_status enum) - Room status: 'awaiting', 'in_progress', or 'finished'

### 3. Regenerate TypeScript Types

After updating the database schema, regenerate your TypeScript types:

```bash
cd packages/web-app
yarn supabase:types
```

This will update `src/lib/database.types.ts` with the new schema.

### 4. Update Your Code

After regenerating types, you may need to update your components to use the new fields:

**Example: Update RoomPage to use `title` instead of `name`:**

```typescript
// If you renamed 'name' to 'title', update references:
<h1>{room.title}</h1>
```

**Example: Display additional fields:**

```typescript
{room.donation_link && (
  <a href={room.donation_link} target="_blank" rel="noopener noreferrer">
    💝 Donate
  </a>
)}

{room.start_time && (
  <p>Starts: {new Date(room.start_time).toLocaleString()}</p>
)}

<span className={`status-${room.status}`}>
  Status: {room.status}
</span>
```

## Field Specifications

### Required Fields:

- **title** (TEXT, NOT NULL) - The room title
- **description** (TEXT) - Room description
- **status** (ENUM, NOT NULL, default: 'awaiting') - One of:
  - `'awaiting'` - Room is waiting to start
  - `'in_progress'` - Room is currently active
  - `'finished'` - Room has ended

### Optional Fields:

- **donation_link** (TEXT, nullable) - URL for donations
- **start_time** (TIMESTAMPTZ, nullable) - When the room starts/started

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Remove the new columns
ALTER TABLE rooms DROP COLUMN IF EXISTS donation_link;
ALTER TABLE rooms DROP COLUMN IF EXISTS start_time;
ALTER TABLE rooms DROP COLUMN IF EXISTS status;

-- Drop the enum type
DROP TYPE IF EXISTS room_status;

-- Remove indexes
DROP INDEX IF EXISTS idx_rooms_status;
DROP INDEX IF EXISTS idx_rooms_start_time;
```

## Notes

- The migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing data will be preserved
- The `status` column will default to `'awaiting'` for existing rows
- You may want to update existing rows to set appropriate status values
