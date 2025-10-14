# Setup Slug-Based URLs

Follow these steps to enable human-readable URLs for rooms:

## 1. Run the Database Migration

Go to: https://app.supabase.com/project/oumenpdjtlflmelorrrj/sql

Paste and run this SQL:

```sql
-- Add slug column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing rooms
UPDATE rooms
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(
    REGEXP_REPLACE(TRIM(name), '\s+', '-', 'g'),
    '[^\w\-]+', '', 'g'
  ),
  '\-\-+', '-', 'g'
))
WHERE slug IS NULL;

-- Make slug unique and not null
ALTER TABLE rooms ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS rooms_slug_unique ON rooms(slug);

-- Add index for faster slug lookups
CREATE INDEX IF NOT EXISTS rooms_slug_idx ON rooms(slug);
```

## 2. Regenerate TypeScript Types

```bash
cd /Users/coenwarmer/Dev/cheerio/packages/web-app
yarn supabase:types
```

## 3. Restart the Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then start it again:
yarn dev
```

## 4. Test the URLs

After completing the above steps, you should be able to access rooms via:

- `/room/tcs-amsterdam`
- `/room/my-awesome-room`

Instead of:

- `/room/3f06beed-d97c-432d-a0f8-21de03b6fba9`

## Troubleshooting

If you still get a 404:

1. Check that the migration ran successfully
2. Verify the room has a slug: `SELECT id, name, slug FROM rooms;`
3. Make sure TypeScript types were regenerated
4. Restart the dev server
