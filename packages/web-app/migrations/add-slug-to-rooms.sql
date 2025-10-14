-- Add slug column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing rooms (if any)
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

