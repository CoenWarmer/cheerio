# Adding Location to Rooms

## Database Setup

### 1. Run the Migration

Go to your Supabase SQL Editor and run:
👉 **https://app.supabase.com/project/oumenpdjtlflmelorrrj/sql**

```sql
-- Enable PostGIS (usually already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location column
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Add spatial index
CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms USING GIST (location);
```

### 2. Regenerate TypeScript Types

```bash
cd packages/web-app
yarn supabase:types
```

## Field Type Explanation

### `geography(Point, 4326)`

- **`geography`**: PostGIS type for real-world geographic data
- **`Point`**: Stores a single lat/lng coordinate
- **`4326`**: SRID (Spatial Reference System Identifier) for WGS84 - the standard GPS coordinate system

### Why Not Just Two Columns?

Using PostGIS `geography` type gives you:

- ✅ **Spatial indexing** - Fast distance queries
- ✅ **Built-in functions** - Distance calculations, proximity searches
- ✅ **Accuracy** - Accounts for Earth's curvature
- ✅ **Standards compliance** - Industry standard for geospatial data

## How to Use in Your Code

### Inserting Location

```typescript
import { supabase } from '@/lib/supabase';

// Option 1: Using raw SQL expression
const { data, error } = await supabase.from('rooms').insert({
  title: 'My Room',
  location: `POINT(-122.4194 37.7749)`, // lng, lat (note order!)
});

// Option 2: Using PostGIS function (after running migration)
const { data, error } = await supabase.rpc('make_point', {
  lng: -122.4194,
  lat: 37.7749,
});
```

### Querying Location

```typescript
// Get rooms with their coordinates
const { data, error } = await supabase
  .from('rooms')
  .select('*')
  .not('location', 'is', null);

// The location field will be in WKT format: "POINT(-122.4194 37.7749)"
```

### Finding Nearby Rooms

```sql
-- Find rooms within 10km of a point
SELECT
  *,
  ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
  ) / 1000 as distance_km
FROM rooms
WHERE location IS NOT NULL
AND ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
  10000  -- 10km in meters
)
ORDER BY distance_km;
```

## TypeScript Type

After regenerating types, your Room type will have:

```typescript
type Room = {
  // ... other fields
  location: string | null; // WKT format: "POINT(lng lat)"
};
```

## Utilities

Use the helper functions in `src/utils/location.ts`:

```typescript
import {
  parseLocation,
  formatLocation,
  getCurrentLocation,
} from '@/utils/location';

// Parse PostGIS location to lat/lng
const coords = parseLocation(room.location);
// { lat: 37.7749, lng: -122.4194 }

// Format for display
formatCoordinates(coords);
// "37.774900°N, 122.419400°W"

// Get user's location
const userLocation = await getCurrentLocation();
```

## Integration Examples

### Add Location to Create Room Form

```typescript
const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

// Add to form
<button onClick={async () => {
  const loc = await getCurrentLocation();
  setCoordinates(loc);
}}>
  📍 Use My Location
</button>

// When submitting
const roomData = {
  title: title,
  location: coordinates
    ? `POINT(${coordinates.lng} ${coordinates.lat})`
    : null,
};
```

### Update Map Component

```typescript
// In RoomMap.tsx
const coords = parseLocation(room.location);
const position = coords
  ? ([coords.lat, coords.lng] as [number, number])
  : [37.7749, -122.4194]; // default
```

## Important Notes

⚠️ **Coordinate Order**: PostGIS uses **(longitude, latitude)** order, not (lat, lng)!

- Longitude first (X coordinate, -180 to 180)
- Latitude second (Y coordinate, -90 to 90)

✅ **Nullable**: The location field is nullable, so rooms can exist without a location

🔍 **Queries**: Use PostGIS functions for distance and proximity queries for best performance
